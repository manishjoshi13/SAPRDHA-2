const express = require("express");
const app = express();
const path = require("path");
const mongoose = require("mongoose");
const methodOverride = require("method-override");
const PDFDocument = require("pdfkit");
require("dotenv").config();

const { Form } = require("./models/form");

// --- DB Connection
async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
}
main()
  .then(() => console.log("Connection success"))
  .catch((err) => console.log(err));

// --- View Engine Setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// --- Middleware
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(express.json({ limit: "10mb" }));
app.use(methodOverride("_method"));

// --- Routes
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

// --- FORM SUBMISSION (CREATE)
app.post("/form", async (req, res) => {
  try {
    // Defensive: log full request body
    console.log("Received full form data: ", JSON.stringify(req.body, null, 2));
    let { name, email, course, year, gender, sports, partners } = req.body;

    const errors = {};

    // --- Validate Required Fields (collect errors)
    if (!name || typeof name !== "string" || !name.trim())
      errors.name = "Name is required";
    if (!email || typeof email !== "string" || !email.trim())
      errors.email = "Email is required";
    if (!course || typeof course !== "string" || !course.trim())
      errors.course = "Course is required";
    if (!year || isNaN(parseInt(year))) errors.year = "Year is required";
    if (!gender || typeof gender !== "string" || !gender.trim())
      errors.gender = "Gender is required";

    // --- Sports array - handle both string and array and remove blank/undefined
    let sportsArray = [];
    if (Array.isArray(sports)) {
      sportsArray = sports.filter((s) => typeof s === "string" && s.trim());
    } else if (typeof sports === "string" && sports.trim()) {
      sportsArray = [sports.trim()];
    }
    if (!sportsArray.length)
      errors.sports = "At least one sport selection is required";

    // --- Partners: always array of objects, each with .sport and .name
    let partnersArray = [];
    // Partners could arrive from browser as:
    // 1. array [{sport, name}]
    // 2. object: { badminton-doubles: {name: "X"}, ...}
    if (partners) {
      if (Array.isArray(partners)) {
        // Sometimes fields may arrive as JSON stringified object, eg. from JS client; fix for that:
        partnersArray = partners
          .map((p) => (typeof p === "string" ? JSON.parse(p) : p))
          .filter(
            (p) =>
              p &&
              typeof p === "object" &&
              p.sport &&
              p.name &&
              String(p.sport).trim() &&
              String(p.name).trim()
          )
          .map((p) => ({
            sport: String(p.sport).trim(),
            name: String(p.name).trim(),
          }));
      } else if (typeof partners === "object") {
        // Partners object from form, each key is sport, value is { name }
        Object.entries(partners).forEach(([sportKey, partnerValue]) => {
          if (
            partnerValue &&
            typeof partnerValue === "object" &&
            partnerValue.name &&
            partnerValue.name.trim()
          ) {
            partnersArray.push({
              sport: String(sportKey).trim(),
              name: String(partnerValue.name).trim(),
            });
          }
        });
      }
    }

    // --- Dedicated: Enforce partnersArray for required sports? Not failing, just ensure safe format.

    // --- STOP IF ERRORS IN ANY FIELD ---
    if (Object.keys(errors).length > 0) {
      console.log("Field validation errors: ", errors);
      return res.status(400).render("form", {
        error: "Please enter all required fields.",
        success: null,
        ...errors,
      });
    }

    // --- Check duplicate email
    const emailToCheck = email.trim().toLowerCase();
    const existing = await Form.findOne({ email: emailToCheck });
    if (existing) {
      return res.redirect("/form?error=duplicate");
    }

    // --- Create & validate form data with schema
    const formData = new Form({
      name: name.trim(),
      email: emailToCheck,
      course: course.trim(),
      year: parseInt(year, 10),
      gender: gender.trim(),
      sports: sportsArray,
      partners: partnersArray,
      status: "pending",
      registrationDate: new Date(),
      lastUpdated: new Date(),
    });

    const validationError = formData.validateSync();
    if (validationError) {
      console.error("Schema validation error: ", validationError);
      // Collect nice error object:
      const schemaErrors = {};
      if (validationError.errors) {
        for (const key in validationError.errors) {
          schemaErrors[key] = validationError.errors[key].message;
        }
      }
      return res.status(400).render("form", {
        error: "There are errors with your submission.",
        success: null,
        ...schemaErrors,
      });
    }

    await formData.save();
    console.log("Form data saved successfully.");
    res.redirect("/form?success=true");
  } catch (err) {
    console.error("Form submission error: ", err);

    if (err.code === 11000) {
      return res.redirect("/form?error=duplicate");
    } else if (err.name === "ValidationError") {
      return res.status(400).render("form", {
        error: "Schema validation error.",
        success: null,
      });
    }

    res.status(500).render("form", {
      error: "An unexpected error occurred, please try again.",
      success: null,
    });
  }
});

// --- ADMIN DATA (READ)
app.get("/admin/data", async (req, res) => {
  try {
    const registrations = await Form.find({}).sort({ createdAt: -1 });
    res.json(registrations);
  } catch (error) {
    console.error("Error fetching registrations:", error);
    res.status(500).json({ error: "Failed to fetch registrations" });
  }
});

// --- DELETE
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

// --- UPDATE
app.put("/admin/:id", async (req, res) => {
  try {
    const { id } = req.params;
    let { name, email, course, year, gender, sports, partners } = req.body;

    // --- Defensive normalization
    let updated = {};
    updated.name = name && name.trim ? name.trim() : "";
    updated.email = email && email.trim ? email.trim().toLowerCase() : "";
    updated.course = course && course.trim ? course.trim() : "";
    updated.year = year ? parseInt(year, 10) : undefined;
    updated.gender = gender && gender.trim ? gender.trim() : "";

    // Normalize sports
    if (Array.isArray(sports)) {
      updated.sports = sports.filter((s) => typeof s === "string" && s.trim());
    } else if (typeof sports === "string" && sports.trim()) {
      updated.sports = [sports.trim()];
    } else {
      updated.sports = [];
    }

    // Normalize partners
    updated.partners = [];
    if (partners) {
      if (Array.isArray(partners)) {
        updated.partners = partners
          .map((p) => (typeof p === "string" ? JSON.parse(p) : p))
          .filter(
            (p) =>
              p &&
              typeof p === "object" &&
              p.sport &&
              p.name &&
              String(p.sport).trim() &&
              String(p.name).trim()
          )
          .map((p) => ({
            sport: String(p.sport).trim(),
            name: String(p.name).trim(),
          }));
      } else if (typeof partners === "object") {
        Object.entries(partners).forEach(([sportKey, partnerValue]) => {
          if (
            partnerValue &&
            typeof partnerValue === "object" &&
            partnerValue.name &&
            partnerValue.name.trim()
          ) {
            updated.partners.push({
              sport: String(sportKey).trim(),
              name: String(partnerValue.name).trim(),
            });
          }
        });
      }
    }

    // Check for duplicate email (excluding current registration)
    if (updated.email) {
      const existing = await Form.findOne({
        email: updated.email,
        _id: { $ne: id },
      });
      if (existing) {
        return res.status(400).json({
          success: false,
          error: "This email is already registered",
        });
      }
    }

    // Validate before update
    const dummy = new Form(updated);
    let validationError = dummy.validateSync();
    if (validationError) {
      const schemaErrors = {};
      if (validationError.errors) {
        for (const key in validationError.errors) {
          schemaErrors[key] = validationError.errors[key].message;
        }
      }
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: schemaErrors,
      });
    }

    await Form.findByIdAndUpdate(id, updated);
    res.json({ success: true });
  } catch (error) {
    console.error("Error updating registration:", error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: "This email is already registered",
      });
    }
    res.status(500).json({ error: "Failed to update registration" });
  }
});

// --- PDF Download
app.get("/admin/download-pdf", async (req, res) => {
  try {
    const { sport, year, gender } = req.query;

    // Build query
    let query = {};
    if (sport) query.sports = sport;
    if (year) query.year = parseInt(year);
    if (gender) query.gender = gender;

    const registrations = await Form.find(query).sort({ year: 1, name: 1 });

    // Create PDF
    const doc = new PDFDocument({ margin: 50 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=sports-registrations-${Date.now()}.pdf`
    );
    doc.pipe(res);

    doc.fontSize(20).text("Sports Event Registrations", { align: "center" });
    doc.moveDown();

    if (sport || year || gender) {
      let filterText = "Filters: ";
      if (sport) filterText += `Sport: ${sport.replace("-", " ")} `;
      if (year) filterText += `Year: ${year} `;
      if (gender) filterText += `Gender: ${gender} `;
      doc.fontSize(12).text(filterText, { align: "center" });
      doc.moveDown();
    }

    doc.fontSize(10).text(`Total Registrations: ${registrations.length}`, {
      align: "center",
    });
    doc.moveDown(2);

    // Group by sport
    const sportGroups = {};
    registrations.forEach((reg) => {
      (reg.sports || []).forEach((sportName) => {
        if (!sportGroups[sportName]) sportGroups[sportName] = [];
        sportGroups[sportName].push(reg);
      });
    });

    // Generate PDF grouped by sport and by year
    Object.keys(sportGroups)
      .sort()
      .forEach((sportName) => {
        const players = sportGroups[sportName];

        doc.fontSize(16).text(
          sportName.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase()),
          { underline: true }
        );
        doc.moveDown(0.5);

        // Group by year
        const yearGroups = {};
        players.forEach((player) => {
          if (!yearGroups[player.year]) yearGroups[player.year] = [];
          yearGroups[player.year].push(player);
        });

        Object.keys(yearGroups)
          .sort()
          .forEach((year) => {
            doc.fontSize(12).text(`Year ${year}:`, { continued: false });
            doc.moveDown(0.3);

            yearGroups[year].forEach((player, idx) => {
              let playerText = `${idx + 1}. ${player.name} (${player.course}, ${
                player.gender
              })`;
              // Partner
              const partnerInfo = (player.partners || []).find(
                (p) => p.sport === sportName
              );
              if (partnerInfo) playerText += ` - Partner: ${partnerInfo.name}`;
              doc.fontSize(10).text(playerText, { indent: 20 });
            });
            doc.moveDown(0.5);
          });

        doc.moveDown(1);
        // Add new page if needed
        if (doc.y > 700) doc.addPage();
      });

    doc.end();
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).send("Error generating PDF");
  }
});

const port = 8000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
