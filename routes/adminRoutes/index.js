const express = require("express");
const router = express.Router();
const { login, signup, addSubject, getSubjects, createCourse, getCourses, createTeacher, getTeachers, getTeacherById, archiveTeacher, updateTeacher } = require("../../controllers/adminControllers");
const { authUser } = require("../../midddleware/auth");
const Teacher = require('../../models/teacherSchema');
const upload = require("../../midddleware/imageUploadMiddleware");

router.post("/login", login);
router.post("/signup", signup);
router.post("/subject", authUser, addSubject);
router.get("/subject", authUser, getSubjects);
router.post("/course", authUser, createCourse);
router.get("/course", authUser, getCourses);
router.post("/teacher", authUser, upload.single("profilePicture"), createTeacher);
router.get("/teacher", authUser, getTeachers);
router.delete("/teacher", authUser, archiveTeacher);
router.put("/teacher", authUser, upload.single("profilePicture"), updateTeacher);
router.get("/teacherById", authUser, getTeacherById);

module.exports = router;
