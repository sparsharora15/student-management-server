const AdminModel = require("../../models/adminSchema");
const Subject = require("../../models/subjectsSchema");
const Teacher = require("../../models/teacherSchema");
const Course = require("../../models/courseSchema");
const Lecture = require("../../models/lecturesModel");
const Student = require("../../models/studentSchema");
const {
  md5Hash,
  capitalizeFirstLetter,
  generateEmployeeID,
  sendLoginDetailsEmail,
  generateRandomPassword,
} = require("../../services");
const jwt = require("jsonwebtoken");
const QRCode = require("qrcode");

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
    const token = jwt.sign({ user }, process.env.JWTSECRETKET);
    return res
      .status(200)
      .json({ status: 200, message: "Logged in", token: token });
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
    res.status(201).json({
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
        return res.status(400).json({
          message: "User with this email already exists in archived list",
        });
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
    res.status(200).json({
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
    console.log(req.body);

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
    await Teacher.updateOne({ _id: teacherId }, { $set: updatedTeacherData });

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
    const { teacherId } = req.query;
    const teachers = await Teacher.findOne({ _id: teacherId }).populate(
      "teachingDepartment",
      "fullName"
    ); // Assuming 'name' is a field in the Course model
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

    if (isArchived === "true") {
      teachers = await Teacher.find({}).populate(
        "teachingDepartment",
        "fullName"
      );
    } else {
      teachers = await Teacher.find({ isDelete: false }).populate(
        "teachingDepartment",
        "fullName"
      );
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
    const { teacherId } = req.query;
    if (!teacherId)
      return res.status(404).json({ message: "Teacher not found" });
    await Teacher.findOneAndUpdate(
      { _id: teacherId },
      { isActive: false, isDelete: true },
      { returnOriginal: false }
    );
    return res.status(200).json({
      status: 200,
      message: "Teachers archived successfully",
    });
  } catch (error) {
    console.error("Error fetching teachers:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const createLecture = async (req, res) => {
  try {
    const {
      collegeStartTime,
      collegeEndTime,
      lectureTime,
      recessTimeFrom,
      recessTimeTo,
    } = req.body;
    const findDocument = await Lecture.find({});
    console.log();
    if (findDocument.length !== 0)
      return res.status(403).json({
        message:
          "Lectures are already created ,If you want to crete new lectures then delete the previous lectures",
      });

    const startTime = new Date(`1970-01-01T${collegeStartTime}`);
    const endTime = new Date(`1970-01-01T${collegeEndTime}`);

    const recessStartTime = new Date(`1970-01-01T${recessTimeFrom}`);
    const recessEndTime = new Date(`1970-01-01T${recessTimeTo}`);

    if (
      recessStartTime < startTime ||
      recessEndTime > endTime ||
      recessEndTime < recessStartTime
    ) {
      return res.status(400).json({
        message:
          "Invalid recess time. It should be within college hours and end time should be after start time.",
      });
    }

    const timeDifference = endTime.getTime() - startTime.getTime();

    const recessTimeDifference =
      recessEndTime.getTime() - recessStartTime.getTime();

    const totalTimeExcludingRecess = timeDifference - recessTimeDifference;

    const totalHoursExcludingRecess =
      totalTimeExcludingRecess / (1000 * 60 * 60);

    const lectureDuration = parseInt(lectureTime);

    const lectures = [];

    let currentTime = startTime.getTime();
    let lectureNumber = 1;
    while (currentTime < endTime.getTime()) {
      if (
        currentTime >= recessStartTime.getTime() &&
        currentTime < recessEndTime.getTime()
      ) {
        currentTime += lectureDuration * 60 * 1000;
        continue;
      }

      const lectureStartTime = new Date(currentTime);
      const lectureEndTime = new Date(
        currentTime + lectureDuration * 60 * 1000
      );

      lectures.push({
        lectureNumber,
        startTime: lectureStartTime.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        endTime: lectureEndTime.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      });

      currentTime += lectureDuration * 60 * 1000;
      lectureNumber++;
    }
    const newLecture = new Lecture({
      lectures: lectures,
      recessTime: `${recessTimeFrom} - ${recessTimeTo}`,
    });

    await newLecture.save();

    res
      .status(201)
      .json({ message: "Lectures created successfully", data: newLecture });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getLectures = async (req, res) => {
  try {
    const lectures = await Lecture.find({});
    return res.status(200).json({ data: lectures });
  } catch (err) {
    console.log(err);
  }
};
const createUser = async (req, res) => {
  try {
    const {
      dob,
      gender,
      course,
      address,
      fullName,
      bloodGroup,
      email,
      fName,
      phoneNo,
    } = req.body;
    // Get current year
    const currentYear = new Date().getFullYear().toString();

    // Get student count
    const studentCount = await Student.countDocuments();

    // Increment student count and pad with leading zeroes
    const studentIndex = (studentCount + 1).toString().padStart(2, "0");

    // Combine student index, "800", and the current year to form the enrollment number
    const enrollmentNo = `${studentIndex}800${currentYear}`;

    const updatedReqBody = {
      fullName: JSON.parse(fullName),
      email: JSON.parse(email),
      phoneNo: JSON.parse(phoneNo),
      dob: JSON.parse(dob),
      address: JSON.parse(address),
      gender: JSON.parse(gender),
      fName: JSON.parse(fName),
      profilePicturePublicId: req.file.filename, // Rename if needed
      course: JSON.parse(course),
      erollmentNo: enrollmentNo, // Add enrollment number to the request body
      bloodGroup: JSON.parse(bloodGroup),
    };
    console.log(req.file.filename);
    const { error } = Student.validate(updatedReqBody);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    if (updatedReqBody.profilePicturePublicId) {
      cloudinaryResponse = await cloudinary.uploader.upload(req.file.path); // Use req.file.path
      console.log(cloudinaryResponse);
    }
    const { profilePicturePublicId, ...rest } = updatedReqBody;
    const newUser = new Student({
      profilePicturePublicId: cloudinaryResponse
        ? cloudinaryResponse.secure_url
        : null,
      ...rest,
    });

    const existingUser = await Student.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User with this email already exists" });
    }

    await newUser.save();
    res.status(200).json({
      status: 200,
      message: "User created successfully",
      data: newUser,
    });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
const getStudent = async (req, res) => {
  try {
    const { isArchived } = req.query;
    let students;

    if (isArchived === "true") {
      students = await Student.find({ isArchived: true }).populate(
        "course",
        "fullName"
      );
    } else {
      students = await Student.find({}).populate("course", "fullName");
      console.log(students);
    }

    res.status(200).json({
      status: 200,
      message: "Students fetched successfully",
      data: students,
    });
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
const getStudentById = async (req, res) => {
  try {
    const API_BASE_URL = process.env.API_BASE_URL
    const { studentId } = req.query;
    const student = await Student.findOne({ _id: studentId }).populate(
      "course",
      "fullName"
    );

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    const qrCodeContent = `https://student-management-server-mn17.onrender.com/api/admin/studentById/${student._id}`;
    const qrCodeImage = await QRCode.toDataURL(qrCodeContent);
    console.log(qrCodeImage)
    return res.status(200).json({
      status: 200,
      message: "Student fetched successfully",
      data: {
        student,
        qrCodeImage,
      },
    });
  } catch (error) {
    console.error("Error fetching student:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
// const updateStudent = async (req, res) => {
//   try {
//     const {
//       dob,
//       gender,
//       course,
//       address,
//       fullName,
//       bloodGroup,
//       email,
//       fName,
//       phoneNo,
//     } = req.body;
//     const studentId = req.query.studentId; // Correctly extract teacherId from the request query

//     const updatedReqBody = {
//       fullName: JSON.parse(fullName),
//       email: JSON.parse(email),
//       phoneNo: JSON.parse(phoneNo),
//       dob: JSON.parse(dob),
//       address: JSON.parse(address),
//       gender: JSON.parse(gender),
//       fName: fName,
//       profilePicturePublicId: req.file.filename, // Rename if needed
//       course: JSON.parse(course),
//       bloodGroup: JSON.parse(bloodGroup),
//     };

//     const existingStrudent = await Student.findById(studentId);
//     if (!existingStrudent) {
//       return res.status(404).json({ message: "student not found" });
//     }

//     // Update student data using $set
//     await Student.updateOne({ _id: studentId }, { $set: updatedStudentData });

//     // Fetch and return the updated student data
//     const updatedStudent = await Student.findById(studentId);

//     res.status(200).json({
//       status: 200,
//       message: "Student updated successfully",
//       data: updatedStudent,
//     });
//   } catch (error) {
//     console.error("Error updating student:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };

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
  updateTeacher,
  createLecture,
  getLectures,
  createUser,
  getStudent,
  getStudentById,
};
