
const express = require("express");
const app = express();
const path = require("path");
const mongoose = require("mongoose");
const methodOverride = require("method-override");
const PDFDocument = require("pdfkit");

// model
const Form = require("./models/form")

// Database Connection
async function main() {
    await mongoose.connect('mongodb://127.0.0.1:27017/spardha');
}
main()
    .then(() => console.log("Connection success"))
    .catch((err) => console.log(err));

// View Engine Setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.json({ limit: '10mb' }));
app.use(methodOverride("_method"));

// Routes
app.get("/", (req, res) => {
    res.render("home");
});

app.get("/form", (req, res) => {
    const { success, error } = req.query;
    res.render("form", { success, error });
});

app.get("/contact", (req, res) => {
    res.render("contact");
});

app.get("/admin", (req, res) => {
    res.render("admin");
});

// Form Submission (CREATE)
app.post("/form", async (req, res) => {
    try {
        const { name, course, year, gender, sports, partners } = req.body;
        
        console.log("Received form data:", { name, course, year, gender, sports, partners });
        
        // Process sports array (handle both single and multiple selections)
        let sportsArray = [];
        if (Array.isArray(sports)) {
            sportsArray = sports;
        } else if (sports) {
            sportsArray = [sports];
        }

        // Process partners object to array format
        let partnersArray = [];
        if (partners) {
            // Handle both object format and array format
            if (typeof partners === 'object' && !Array.isArray(partners)) {
                Object.keys(partners).forEach(sport => {
                    const partnerName = partners[sport];
                    // Handle both string and object formats
                    let name = '';
                    if (typeof partnerName === 'string') {
                        name = partnerName.trim();
                    } else if (partnerName && typeof partnerName === 'object' && partnerName.name) {
                        name = partnerName.name.trim();
                    }
                    
                    if (name) {
                        partnersArray.push({
                            sport: sport,
                            name: name
                        });
                    }
                });
            } else if (Array.isArray(partners)) {
                partnersArray = partners.filter(p => p && p.name && p.sport);
            }
        }

        console.log("Processed partners:", partnersArray);

        const formData = new Form({
            name: name.trim(),
            course: course.trim(),
            year: parseInt(year),
            gender: gender,
            sports: sportsArray,
            partners: partnersArray
        });

        const savedData = await formData.save();
        console.log("Saved registration:", JSON.stringify(savedData, null, 2));
        console.log("Saved partners:", savedData.partners);
        res.redirect("/form?success=true");
    } catch (error) {
        console.error("Error saving form:", error);
        console.error("Error details:", error.message);
        res.redirect("/form?error=true");
    }
});

// Get all registrations for admin (READ)
app.get("/admin/data", async (req, res) => {
    try {
        const registrations = await Form.find({}).sort({ createdAt: -1 });
        console.log("Fetched registrations count:", registrations.length);
        if (registrations.length > 0) {
            console.log("Sample registration:", JSON.stringify(registrations[0], null, 2));
            console.log("Sample registration partners:", registrations[0].partners);
        }
        res.json(registrations);
    } catch (error) {
        console.error("Error fetching registrations:", error);
        console.error("Error stack:", error.stack);
        res.status(500).json({ error: "Failed to fetch registrations", message: error.message });
    }
});

// Delete registration (DELETE)
app.delete("/admin/:id", async (req, res) => {
    try {
        const { id } = req.params;
        await Form.findByIdAndDelete(id);
        res.json({ success: true });
    } catch (error) {
        console.error("Error deleting registration:", error);
        res.status(500).json({ error: "Failed to delete registration" });
    }
});

// Update registration (UPDATE)
app.put("/admin/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { name, course, year, gender, sports, partners } = req.body;
        
        let sportsArray = [];
        if (Array.isArray(sports)) {
            sportsArray = sports;
        } else if (sports) {
            sportsArray = [sports];
        }

        let partnersArray = [];
        if (partners && typeof partners === 'object') {
            Object.keys(partners).forEach(sport => {
                const partnerName = partners[sport];
                if (partnerName && typeof partnerName === 'string' && partnerName.trim()) {
                    partnersArray.push({
                        sport: sport,
                        name: partnerName.trim()
                    });
                }
            });
        }

        const updatedData = {
            name: name.trim(),
            course: course.trim(),
            year: parseInt(year),
            gender: gender,
            sports: sportsArray,
            partners: partnersArray
        };

        await Form.findByIdAndUpdate(id, updatedData);
        res.json({ success: true });
    } catch (error) {
        console.error("Error updating registration:", error);
        res.status(500).json({ error: "Failed to update registration" });
    }
});

// PDF Download
app.get("/admin/download-pdf", async (req, res) => {
    try {
        const { sport, year, gender } = req.query;
        
        // Build query
        let query = {};
        if (sport) {
            query.sports = sport;
        }
        if (year) {
            query.year = parseInt(year);
        }
        if (gender) {
            query.gender = gender;
        }

        const registrations = await Form.find(query).sort({ year: 1, name: 1 });

        // Create PDF
        const doc = new PDFDocument({ margin: 50 });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=sports-registrations-${Date.now()}.pdf`);
        
        doc.pipe(res);

        // PDF Header
        doc.fontSize(20).text('Sports Event Registrations', { align: 'center' });
        doc.moveDown();
        
        if (sport || year || gender) {
            let filterText = 'Filters: ';
            if (sport) filterText += `Sport: ${sport.replace('-', ' ')} `;
            if (year) filterText += `Year: ${year} `;
            if (gender) filterText += `Gender: ${gender} `;
            doc.fontSize(12).text(filterText, { align: 'center' });
            doc.moveDown();
        }

        doc.fontSize(10).text(`Total Registrations: ${registrations.length}`, { align: 'center' });
        doc.moveDown(2);

        // Group by sport
        const sportGroups = {};
        registrations.forEach(reg => {
            reg.sports.forEach(sportName => {
                if (!sportGroups[sportName]) {
                    sportGroups[sportName] = [];
                }
                sportGroups[sportName].push(reg);
            });
        });

        // Generate PDF content grouped by sport
        Object.keys(sportGroups).sort().forEach(sportName => {
            const players = sportGroups[sportName];
            
            doc.fontSize(16).text(sportName.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()), { underline: true });
            doc.moveDown(0.5);

            // Group by year
            const yearGroups = {};
            players.forEach(player => {
                if (!yearGroups[player.year]) {
                    yearGroups[player.year] = [];
                }
                yearGroups[player.year].push(player);
            });

            Object.keys(yearGroups).sort().forEach(year => {
                doc.fontSize(12).text(`Year ${year}:`, { continued: false });
                doc.moveDown(0.3);

                yearGroups[year].forEach((player, index) => {
                    let playerText = `${index + 1}. ${player.name} (${player.course}, ${player.gender})`;
                    
                    // Add partner information if exists
                    const partnerInfo = player.partners.find(p => p.sport === sportName);
                    if (partnerInfo) {
                        playerText += ` - Partner: ${partnerInfo.name}`;
                    }
                    
                    doc.fontSize(10).text(playerText, { indent: 20 });
                });
                doc.moveDown(0.5);
            });

            doc.moveDown(1);
            
            // Add new page if needed
            if (doc.y > 700) {
                doc.addPage();
            }
        });

        doc.end();
    } catch (error) {
        console.error("Error generating PDF:", error);
        res.status(500).send("Error generating PDF");
    }
});

// Start Server
const port = 8000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});