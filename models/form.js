const mongoose = require("mongoose");

/**
 * SPORT CATEGORIES & CONSTANTS
 */
const SPORT_CATEGORIES = {
    OUTDOOR: ['cricket', 'football', 'volleyball', 'kho-kho'],
    INDOOR: {
        badminton: ['single', 'doubles', 'mixed'],
        tabletennis: ['single', 'doubles', 'mixed'],
        carrom: ['singles', 'doubles'],
        chess: ['singles']
    },
    ATHLETICS: ['100m', '200m', '650m', '1200m', 'relay'],
    FUN_ACTIVITIES: [
        'dodgeball', 'tugofwar', 'lemonspoon', 'sackrace', 'threelegrace',
        'facepainting', 'calligraphy', 'creativewriting', 'cooking',
        'bestoutofwaste', 'mehandi', 'poetry', 'graphicdesign'
    ]
};

// Generate complete list of valid sports (as sent from the form)
const ALL_SPORTS = [
    ...SPORT_CATEGORIES.OUTDOOR,
    ...Object.entries(SPORT_CATEGORIES.INDOOR).flatMap(([sport, types]) =>
        types.map(type => `${sport}-${type}`)
    ),
    ...SPORT_CATEGORIES.ATHLETICS,
    ...SPORT_CATEGORIES.FUN_ACTIVITIES
];

// The sports (from ALL_SPORTS) that can require partners
const PARTNER_SPORTS = [
    'badminton-doubles', 'badminton-mixed',
    'tabletennis-doubles', 'tabletennis-mixed',
    'carrom-doubles'
];

// Validation helper for partner field
function isPartnerSport(val) {
    return PARTNER_SPORTS.includes(val);
}

/**
 * PARTNER SCHEMA
 * If the user chooses a sport that requires a partner, partners[] entry should be filled.
 * partners: [{ sport, name }] with requirements: sport is one of PARTNER_SPORTS, name is required.
 */
const partnerSchema = new mongoose.Schema({
    sport: {
        type: String,
        enum: {
            values: PARTNER_SPORTS,
            message: 'Invalid partner sport'
        },
        required: [true, 'Sport type is required for partner']
    },
    name: {
        type: String,
        required: [true, 'Partner name is required'],
        trim: true,
        maxlength: [100, 'Partner name is too long']
    }
}, { _id: false });

/**
 * MAIN FORM SCHEMA
 * This defines how the registration documents are saved.
 * Note: Ensure the FORM matches the front-end field names and POST data.
 */
const formSchema = new mongoose.Schema({
    // BASIC FIELDS
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        maxlength: [100, 'Name cannot be more than 100 characters'],
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        trim: true,
        lowercase: true,
        unique: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email address']
    },
    course: {
        type: String,
        required: [true, 'Course is required'],
        trim: true,
        maxlength: [100, 'Course cannot be more than 100 characters']
    },
    year: {
        type: Number,
        required: [true, 'Year is required'],
        min: [1, 'Year must be at least 1'],
        max: [4, 'Year must be at most 4']
    },
    gender: {
        type: String,
        required: [true, 'Gender is required'],
        enum: {
            values: ['boy', 'girl'],
            message: 'Gender must be either boy or girl'
        }
    },

    // SPORTS (REQUIRED ARRAY OF STRINGS)
    sports: {
        type: [String],
        required: [true, 'At least one sport must be selected'],
        validate: {
            validator: function (arr) {
                return Array.isArray(arr) && arr.length > 0 && arr.every(s => ALL_SPORTS.includes(s));
            },
            message: 'One or more selected sports are invalid or empty.'
        }
    },

    // PARTNERS (OPTIONAL but required in context of certain sports)
    partners: {
        type: [partnerSchema],
        default: [],
        validate: {
            validator: function (arr) {
                // If selected sports require partners, partners[] should contain a valid entry for each
                if (!Array.isArray(this.sports) || this.sports.length === 0) return arr.length === 0;
                const requiredSports = this.sports.filter(s => PARTNER_SPORTS.includes(s));
                if (requiredSports.length === 0) return arr.length === 0;
                // Make sure every required partner sport has an entry, and not more
                const uniquePartnerSports = arr.map(p => p.sport);
                return (
                    requiredSports.length === arr.length &&
                    requiredSports.every(sreq => uniquePartnerSports.includes(sreq))
                );
            },
            message: 'Each selected partner sport must have exactly one corresponding partner name.'
        }
    },

    // SYSTEM/ADMIN FIELDS
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

/**
 * FIX: Sports index for large arrays
 */
formSchema.index({ 'sports': 1 });
formSchema.index({ status: 1 });

/**
 * UTILITIES: Virtuals and methods
 */
formSchema.virtual('fullName').get(function () {
    return this.name;
});

formSchema.statics.getSportCategories = function () {
    return SPORT_CATEGORIES;
};

formSchema.statics.getPartnerSports = function () {
    return PARTNER_SPORTS;
};

formSchema.methods.requiresPartner = function (sport) {
    return PARTNER_SPORTS.includes(sport);
};

/**
 * EXPORT MODEL
 * Export Form, categories, partners constant for use elsewhere.
 */
const Form = mongoose.model("Form", formSchema);

module.exports = {
    Form,
    SPORT_CATEGORIES,
    PARTNER_SPORTS
};
