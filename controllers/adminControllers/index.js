const AdminModel = require("../../models/adminSchema");
const Subject = require("../../models/subjectsSchema");
const Teacher = require("../../models/teacherSchema");
const Course = require("../../models/courseSchema");
const { md5Hash, capitalizeFirstLetter, generateEmployeeID, sendLoginDetailsEmail, generateRandomPassword } = require("../../services");
const jwt = require("jsonwebtoken");

const { cloudinary } = require("../../constant/index");

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const errors = [];
    if (!email || email.trim() === "") {
      return res.status(400).json({ error: "Invalid email address" });
    }

    const user = await AdminModel.findOne({ email: email });
    if (!user) {
      return res.status(400).json({ error: "Email not found" });
    }
    if (user.password !== md5Hash(password)) {
      return res.status(401).json({ error: "Incorrect password" });
    }
    const token = jwt.sign(
      { user },
      process.env.JWTSECRETKET
    );
    return res
      .status(200)
      .json({ status: 200, msg: "Logged in", token: token });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "An unexpected error occurred" });
  }
};
const addSubject = async (req, res) => {
  try {
    let { fullName } = req.body;

    fullName = await capitalizeFirstLetter(fullName);

    // Check if the subject already exists (case-insensitive)
    const existingSubject = await Subject.findOne({
      name: { $regex: new RegExp("^" + fullName + "$", "i") },
    });
    if (existingSubject) {
      // Subject already exists, throw an exception
      throw new Error("Subject already exists");
    }

    // Subject doesn't exist, proceed to add it
    const newSubject = new Subject({
      name: fullName,
    });

    await newSubject.save();

    res
      .status(201)
      .json({ status: 200, message: "Subject added successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message || "Internal server error" });
  }
};

const getSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find({});

    res.status(200).json({ status: 200, subjects });
  } catch (error) {
    // Return error response if something goes wrong
    console.error("Error fetching subjects:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
const createCourse = async (req, res) => {
  try {
    const { totalSem, fullName, courseYear, semesters } = req.body;

    // Validate if required fields are present in the request body
    if (!totalSem || !fullName || !courseYear || !semesters) {
      return res.status(400).json({ message: "Required fields are missing" });
    }

    // Check if a course with the same name (case-insensitive) already exists
    const existingCourse = await Course.findOne({
      fullName: { $regex: new RegExp(fullName, "i") },
    });
    if (existingCourse) {
      throw new Error("Course with the same name already exists");
    }

    // Create a new document based on the Course schema
    const newDocument = new Course({
      totalSem,
      fullName,
      courseYear,
      semesters,
    });

    // Save the new document to the database
    await newDocument.save();

    // Return success response
    res
      .status(201)
      .json({
        status: 201,
        message: "Course created successfully",
        data: newDocument,
      });
  } catch (error) {
    // Return error response if something goes wrong
    console.error("Error creating document:", error);
    res.status(500).json({ message: error.message || "Internal server error" });
  }
};

const getCourses = async (req, res) => {
  try {
    // Extract search query from request query parameters
    const searchQuery = req.query.name;

    let aggregationPipeline = [
      {
        $project: {
          _id: 1, // Include the _id field
          name: "$fullName",
          courseYear: "$courseYear",
          totalSubjects: {
            $sum: {
              $sum: {
                $map: {
                  input: "$semesters",
                  as: "s",
                  in: { $size: "$$s.subjects" },
                },
              },
            },
          },
          totalSemesters: { $toInt: "$totalSem" }, // Convert totalSem to integer
        },
      },
    ];

    // Check if search query exists, then add $match stage for search
    if (searchQuery) {
      aggregationPipeline.unshift({
        $match: {
          fullName: { $regex: new RegExp(searchQuery, "i") }, // Case-insensitive search
        },
      });
    }

    // Run the aggregation pipeline
    const courseAggregation = await Course.aggregate(aggregationPipeline);

    res.status(200).json({ status: 200, documents: courseAggregation });
  } catch (error) {
    console.error("Error fetching documents:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const signup = async (req, res) => {
  try {
    const { name, email, password, phoneNo, role } = req.body;

    // Check if email is already registered
    const existingAdmin = await AdminModel.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Hash password using MD5
    const hashedPassword = md5Hash(password);

    // Create new admin
    const newAdmin = new AdminModel({
      name,
      email,
      password: hashedPassword,
      phoneNo,
      role,
    });

    // Save admin to database
    await newAdmin.save();

    res.status(201).json({ message: "Admin created successfully" });
  } catch (error) {
    console.error("Error creating admin:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
const createTeacher = async (req, res) => {
  try {
    const {
      teachingDepartment,
      fullName,
      email,
      phoneNo,
      dob,
      address,
      isActive,
      role,
      gender,
    } = req.body;
    const password = await generateRandomPassword();
    const employeeID = await generateEmployeeID();
    const updatedReqBody = {
      fullName: JSON.parse(fullName),
      email: JSON.parse(email),
      phoneNo: JSON.parse(phoneNo),
      dob: JSON.parse(dob),
      address: JSON.parse(address),
      isActive: JSON.parse(isActive),
      gender: JSON.parse(gender),
      role: role,
      employeeID: employeeID,
      profilePicturePublicId: req.file.filename, // Rename if needed
      teachingDepartment: JSON.parse(teachingDepartment),
      password: md5Hash(password),
    };
    const { error } = Teacher.validate(updatedReqBody);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const existingTeacher = await Teacher.findOne({ email: JSON.parse(email) });
    if (existingTeacher) {
      if (existingTeacher.isDelete) {
        return res
          .status(400)
          .json({ message: "User with this email already exists in archived list" });
      }
      return res
        .status(400)
        .json({ message: "User with this email already exists" });
    }
    let cloudinaryResponse;
    if (updatedReqBody.profilePicturePublicId) {
      cloudinaryResponse = await cloudinary.uploader.upload(req.file.path); // Use req.file.path
    }
    const { profilePicturePublicId, ...rest } = updatedReqBody;
    const newTeacher = new Teacher({
      ...rest,
      profilePicturePublicId: cloudinaryResponse
        ? cloudinaryResponse.secure_url
        : null,
    });

    await newTeacher.save();
    await sendLoginDetailsEmail(email, password); 
    res
      .status(200)
      .json({
        status: 200,
        message: "Teacher created successfully",
        data: newTeacher,
      });
  } catch (error) {
    console.error("Error creating teacher:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
const updateTeacher = async (req, res) => {
  try {
    const {
      teachingDepartment,
      fullName,
      email,
      phoneNo,
      dob,
      address,
      isActive,
      gender,
    } = req.body;
    console.log(req.body)

    const teacherId = req.query.teacherId; // Correctly extract teacherId from the request query

    const updatedTeacherData = {
      fullName: JSON.parse(fullName),
      email: JSON.parse(email),
      phoneNo: JSON.parse(phoneNo),
      dob: JSON.parse(dob),
      address: JSON.parse(address),
      isActive: JSON.parse(isActive),
      gender: JSON.parse(gender),
      teachingDepartment: JSON.parse(teachingDepartment),
    };

    const existingTeacher = await Teacher.findById(teacherId);
    if (!existingTeacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    // Update teacher data using $set
    await Teacher.updateOne(
      { _id: teacherId },
      { $set: updatedTeacherData }
    );

    // Fetch and return the updated teacher data
    const updatedTeacher = await Teacher.findById(teacherId);

    res.status(200).json({
      status: 200,
      message: "Teacher updated successfully",
      data: updatedTeacher,
    });
  } catch (error) {
    console.error("Error updating teacher:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getTeacherById = async (req, res) => {
  try {
    const { teacherId } = req.query
    const teachers = await Teacher.findOne({ _id: teacherId }).populate('teachingDepartment', 'fullName'); // Assuming 'name' is a field in the Course model
    res.status(200).json({
      status: 200,
      message: "Teachers fetched successfully",
      data: teachers,
    });
  } catch (error) {
    console.error("Error fetching teachers:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
const getTeachers = async (req, res) => {
  try {
    const { isArchived } = req.query;
    let teachers;

    if (isArchived === 'true') {
      // Fetch all teachers if isArchived is true
      teachers = await Teacher.find({}).populate('teachingDepartment', 'fullName');
    } else {
      // Fetch teachers whose isDelete is false if isArchived is false or not provided
      teachers = await Teacher.find({ isDelete: false }).populate('teachingDepartment', 'fullName');
    }

    res.status(200).json({
      status: 200,
      message: "Teachers fetched successfully",
      data: teachers,
    });
  } catch (error) {
    console.error("Error fetching teachers:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const archiveTeacher = async (req, res) => {
  try {
    const { teacherId } = req.query
    if (!teacherId) return res.status(404).json({ message: "Teacher not found" })
    await Teacher.findOneAndUpdate({ _id: teacherId }, { isActive: false, isDelete: true }, { returnOriginal: false })
    return res.status(200).json({
      status: 200,
      message: "Teachers archived successfully",
    });
  } catch (error) {
    console.error("Error fetching teachers:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  login,
  signup,
  addSubject,
  getSubjects,
  createCourse,
  getCourses,
  createTeacher,
  getTeachers,
  getTeacherById,
  archiveTeacher,
  updateTeacher
};
