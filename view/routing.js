const express = require("express");
const router = express.Router();
const userController = require("../controller.js/controller");
const { validateRegister } = require("../middleware/validate");
const auth = require("../middleware/auth.js");
const role = require("../middleware/role.js");
const {upload} = require("../middleware/imguploader.js");


// Register route
router.post("/register", validateRegister, userController.register);  
router.post("/login",userController.login);
router.post("/logout", auth, userController.logout); 
router.post("/subscribe/:planId", auth, userController.subscribePlan); 
router.get("/my-subscriptions", auth, userController.getMySubscriptions);
router.post("/userDashboard", auth, userController.userDashboard);


router.post("/create-order",auth, userController.createOrder);
router.post("/verify", userController.verifyPayment);


//admin routes
router.post( "/plans", upload.single("image"), auth, role("admin"), userController.createPlans);
router.get("/getplans", userController.getPlans);
router.post("/update",auth, role("admin"),upload.single("image"),userController.updatePlan);
router.delete("/delete/:id",auth,role("admin"),userController.deletePlan);
router.get("/allusers", auth, role("admin"), userController.getAllUsers);
router.post("/admindashboard", userController.Dashboard);



module.exports = router;
