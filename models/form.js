const mongoose = require("mongoose");

const formSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    course: {
        type: String,
        required: true,
        trim: true
    },
    year: {
        type: Number,
        required: true,
        min: 1,
        max: 4 // College event - 4 years
    },
    gender: {
        type: String,
        enum: ['boy', 'girl'],
        required: true
    },
    sports: [{
        type: String,
        enum: [
            "cricket",
            "football",
            "volleyball",
            "badminton-single",
            "badminton-doubles",
            "badminton-mixed",
            "carrom-singles",
            "carrom-doubles",
            "chess"
        ],
        required: true
    }],
    partners: [{
        sport: {
            type: String,
            enum: [
                "badminton-doubles",
                "badminton-mixed",
                "carrom-doubles"
            ],
            required: true
        },
        name: {
            type: String,
            trim: true,
            required: true
        }
    }]
}, { timestamps: true });

const Form = mongoose.model("Form", formSchema);

module.exports = Form;

