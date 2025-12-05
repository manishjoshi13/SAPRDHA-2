const mongoose = require("mongoose");

// Define sport categories and their configurations
const SPORT_CATEGORIES = {
    OUTDOOR: ['cricket', 'football', 'volleyball'],
    INDOOR: {
        'badminton': ['single', 'doubles', 'mixed'],
        'tabletennis': ['single', 'doubles', 'mixed'],
        'carrom': ['singles', 'doubles'],
        'chess': ['singles']
    },
    ATHLETICS: ['100m', '200m', '650m', '1200m', 'relay'],
    FUN_ACTIVITIES: [
        'dodgeball', 'tugofwar', 'lemonspoon', 'sackrace', 'threelegrace',
        'facepainting', 'calligraphy', 'creativewriting', 'cooking',
        'bestoutofwaste', 'mehandi', 'poetry', 'graphicdesign'
    ]
};

// Generate all possible sport values
const ALL_SPORTS = [
    ...SPORT_CATEGORIES.OUTDOOR,
    ...Object.entries(SPORT_CATEGORIES.INDOOR).flatMap(([sport, types]) => 
        types.map(type => `${sport}-${type}`)
    ),
    ...SPORT_CATEGORIES.ATHLETICS,
    ...SPORT_CATEGORIES.FUN_ACTIVITIES
];

// Define sports that require partners (doubles and mixed)
const PARTNER_SPORTS = [
    'badminton-doubles', 'badminton-mixed',
    'tabletennis-doubles', 'tabletennis-mixed',
    'carrom-doubles'
];

const formSchema = new mongoose.Schema({
    // Basic Information
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        maxlength: [100, 'Name cannot be more than 100 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        trim: true,
        lowercase: true,
        unique: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
    },
    course: {
        type: String,
        required: [true, 'Course is required'],
        trim: true,
        maxlength: [100, 'Course name is too long']
    },
    year: {
        type: Number,
        required: [true, 'Year of study is required'],
        min: [1, 'Invalid year of study'],
        max: [4, 'Invalid year of study']
    },
    gender: {
        type: String,
        enum: {
            values: ['boy', 'girl'],
            message: 'Gender must be either boy or girl'
        },
        required: [true, 'Gender is required']
    },
    
    // Sports Selection
    sports: [{
        type: String,
        enum: {
            values: ALL_SPORTS,
            message: 'Invalid sport selected'
        },
        required: [true, 'At least one sport must be selected']
    }],
    
    // Partners for doubles/mixed sports
    partners: [{
        sport: {
            type: String,
            enum: PARTNER_SPORTS,
            required: [true, 'Sport type is required for partner']
        },
        name: {
            type: String,
            required: [true, 'Partner name is required'],
            trim: true,
            maxlength: [100, 'Partner name is too long']
        },
        default: []
    }],
    
    
    // System Fields
    registrationDate: {
        type: Date,
        default: Date.now
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'waitlisted'],
        default: 'pending'
    },
    notes: {
        type: String,
        trim: true,
        maxlength: [1000, 'Notes cannot exceed 1000 characters']
    }
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Add indexes for better query performance

formSchema.index({ 'sports': 1 });
formSchema.index({ status: 1 });

// Virtual for full name
formSchema.virtual('fullName').get(function() {
    return this.name;
});

// Pre-save hook to update lastUpdated
// formSchema.pre('save', function(next) {
//     this.lastUpdated = Date.now();
//     next();


    
// });

// Static method to get sport categories
formSchema.statics.getSportCategories = function() {
    return SPORT_CATEGORIES;
};

// Static method to get partner sports
formSchema.statics.getPartnerSports = function() {
    return PARTNER_SPORTS;
};

// Method to check if a sport requires a partner
formSchema.methods.requiresPartner = function(sport) {
    return PARTNER_SPORTS.includes(sport);
};

// Create and export the model
const Form = mongoose.model("Form", formSchema);

module.exports = {
    Form,
    SPORT_CATEGORIES,
    PARTNER_SPORTS
};

