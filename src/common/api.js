import axios from "axios";

// axios.defaults.baseURL = "https://sistem-408807.et.r.appspot.com";
//axios.defaults.baseURL = "http://localhost:3001";
axios.defaults.baseURL = "https://sistembackend.dcism.org";

class Api {
  constructor() {
    this.config = {
      headers: {
        "Content-Type": "application/json",
      },
    };
  }

  async signInUser(email) {
    try {
      const response = await axios.get(`/api/user/sign-in/${email}`);
      return response;
    } catch (error) {
      console.log(error);
      return error.response;
    }
  }

  async getUsers() {
    try {
      const response = await axios.get("/api/user/all-users");

      return response;
    } catch (error) {
      console.log(error);
    }
  }

  async getStudents() {
    try {
      const response = await axios.get("/api/user/all-students");

      return response;
    } catch (error) {
      console.log(error);
    }
  }

  async getFaculties() {
    try {
      const response = await axios.get("/api/user/all-faculties");

      return response;
    } catch (error) {
      console.log(error);
    }
  }

  async updateStudentUser(userId, formData) {
    try {
      const response = await axios.patch(
        `/api/user/update-student/${userId}`,
        formData
      );

      return response;
    } catch (error) {
      console.log(error);
    }
  }

  async updateFacultyUser(userId, formData) {
    try {
      const response = await axios.patch(
        `/api/user/update-faculty/${userId}`,
        formData
      );

      return response;
    } catch (error) {
      console.log(error);
    }
  }

  async updateUserStatus(userId, formData) {
    try {
      const response = await axios.patch(
        `/api/user/update-user-status/${userId}`,
        formData
      );

      return response;
    } catch (error) {
      console.log(error);
    }
  }

  async getSpecialRequestOptions() {
    try {
      const response = await axios.get("/api/special-request-option/");

      return response;
    } catch (error) {
      console.log(error);
    }
  }

  async createSpecialRequestOption(formData) {
    try {
      const response = await axios.post(
        "/api/special-request-option/",
        formData
      );

      return response;
    } catch (error) {
      console.log(error);
    }
  }

  async updateSpecialRequestOption(requestId, formData) {
    try {
      const response = await axios.patch(
        `/api/special-request-option/${requestId}`,
        formData
      );

      return response;
    } catch (error) {
      console.log(error);
    }
  }

  async deleteSpecialRequestOption(requestId) {
    try {
      const response = await axios.delete(
        `/api/special-request-option/${requestId}`
      );

      return response;
    } catch (error) {
      console.log(error);
    }
  }

  async getMOA() {
    try {
      const response = await axios.get("/api/moa/");

      return response;
    } catch (error) {
      console.log(error);
    }
  }

  async getMOATypes() {
    try {
      const response = await axios.get("/api/moa/types");
      return response;
    } catch (error) {
      console.log(error)
    }
  }

  async createMOA(formData) {
    try {
      const response = await axios.post("/api/moa/", formData);

      return response;
    } catch (error) {
      console.log(error);
    }
  }

  async createMOAType(formData) {
    try {
      const response = await axios.post("/api/moa/types", formData);
      return response;
    } catch (error) {
      console.log(error)
    }
  }

  async editMOAType(id, formData) {
    try {
      const response = await axios.patch(`/api/moa/types/${id}`, formData);
      return response;
    } catch (error) {
      console.log(error)
    }
  }

  async deleteMOAType(id) {
    try {
      const response = await axios.delete(`/api/moa/types/${id}`);
      return response;
    } catch (error) {
      console.log(error)
    }
  }

  async updateMOA(moaId, formData) {
    try {
      const response = await axios.patch(`/api/moa/${moaId}`, formData);

      return response;
    } catch (error) {
      console.log(error);
    }
  }

  async deleteMOA(moaId) {
    try {
      const response = await axios.delete(`/api/moa/${moaId}`);

      return response;
    } catch (error) {
      console.log(error);
    }
  }

  async getRetainedStudents() {
    try {
      const response = await axios.get("/api/user/retained-students");

      return response;
    } catch (error) {
      console.log(error);
    }
  }

  async allowStudentAccess(idNumber) {
    try {
      const response = await axios.patch(`/api/user/allow-student/${idNumber}`);

      return response;
    } catch (error) {
      console.log(error);
    }
  }

  async getUser(userId) {
    try {
      const response = await axios.get(`/api/user/user/${userId}`);

      return response;
    } catch (error) {
      console.log(error);
    }
  }

  async getPetitions() {
    try {
      const response = await axios.get("/api/petition/");

      return response;
    } catch (error) {
      console.log(error);
    }
  }

  async createPetition(formData) {
    try {
      const response = await axios.post("/api/petition/", formData);

      return response;
    } catch (error) {
      console.log(error);
    }
  }

  async getPetition(petitionId) {
    try {
      const response = await axios.get(`/api/petition/${petitionId}`);
      return response;
    } catch (error) {
      console.log(error);
    }
  }

  async joinPetition(petitionId, formData) {
    try {
      const response = await axios.patch(
        `/api/petition/join/${petitionId}`,
        formData
      );

      return response;
    } catch (error) {
      console.log(error);
    }
  }

  async leavePetition(petitionId, formData) {
    try {
      const response = await axios.patch(
        `/api/petition/leave/${petitionId}`,
        formData
      );

      return response;
    } catch (error) {
      console.log(error);
    }
  }

  async deletePetition(petitionId) {
    try {
      const response = await axios.delete(`/api/petition/${petitionId}`);

      return response;
    } catch (error) {
      console.log(error);
    }
  }

  async approvePetitionByChair(petitionId, formData) {
    try {
      const response = await axios.patch(
        `/api/petition/chair-approve/${petitionId}`,
        formData
      );

      return response;
    } catch (error) {
      console.log(error);
    }
  }

  async setPetitionDeadline(petitionId, formData) {
    try {
      const response = await axios.patch(
        `/api/petition/deadline/${petitionId}`,
        formData
      );

      return response;
    } catch (error) {
      console.log(error);
    }
  }

  async getStudentJoinedPetitions(studentId) {
    try {
      const response = await axios.get(`/api/petition/student/${studentId}`);

      return response;
    } catch (error) {
      console.log(error);
    }
  }

  async getStudentWaitingList(studentId) {
    try {
      const response = await axios.get(
        `/api/petition/waiting-list/${studentId}`
      );

      return response;
    } catch (error) {
      console.log(error);
    }
  }

  async approvePetitionByCoordinator(petitionId, formData) {
    try {
      const response = await axios.patch(
        `/api/petition/coordinator-approve/${petitionId}`,
        formData
      );

      return response;
    } catch (error) {
      console.log(error);
    }
  }

  async joinWaitingList(petitionId, formData) {
    try {
      const response = await axios.patch(
        `/api/petition/join-waiting-list/${petitionId}`,
        formData
      );

      return response;
    } catch (error) {
      console.log(error);
    }
  }

  async leaveWaitingList(petitionId, formData) {
    try {
      const response = await axios.patch(
        `/api/petition/leave-waiting-list/${petitionId}`,
        formData
      );

      return response;
    } catch (error) {
      console.log(error);
    }
  }

  async confirmParticipation(petitionId, formData) {
    try {
      const response = await axios.patch(
        `/api/petition/confirm-join/${petitionId}`,
        formData
      );

      return response;
    } catch (error) {
      console.log(error);
    }
  }

  async addRemarksToPetition(petitionId, formData) {
    try {
      const response = await axios.patch(
        `/api/petition/add-remarks/${petitionId}`,
        formData
      );

      return response;
    } catch (error) {
      console.log(error);
    }
  }

  async createSpecialRequest(formData) {
    try {
      const response = await axios.post("/api/special-request/", formData);

      return response;
    } catch (error) {
      console.log(error);
    }
  }

  async updateSpecialRequest(specialRequestId, formData) {
    try {
      const response = await axios.patch(
        `/api/special-request/${specialRequestId}`,
        formData
      );

      return response;
    } catch (error) {
      console.log(error);
    }
  }

  async getSpecialRequest(specialRequestId) {
    try {
      const response = await axios.get(
        `/api/special-request/${specialRequestId}`
      );

      return response;
    } catch (error) {
      console.log(error);
    }
  }

  async getSpecialRequests() {
    try {
      const response = await axios.get("/api/special-request/");

      return response;
    } catch (error) {
      console.log(error);
    }
  }

  async getSpecialRequestsBySemAndProgram(semester, year, program) {
    try {
      const response = await axios.get(
        `/api/special-request/program-current/${year}/${semester}/${program}`
      );

      return response;
    } catch (error) {
      console.log(error);
    }
  }

  async coordinatorApproveSpecialRequest(specialRequestId, formData) {
    try {
      const response = await axios.patch(
        `/api/special-request/coordinator-approve/${specialRequestId}`,
        formData
      );

      return response;
    } catch (error) {
      console.log(error);
    }
  }

  async chairApproveSpecialRequest(specialRequestId, formData) {
    try {
      const response = await axios.patch(
        `/api/special-request/chair-approve/${specialRequestId}`,
        formData
      );

      return response;
    } catch (error) {
      console.log(error);
    }
  }

  async getStudentSpecialRequests(studentId) {
    try {
      const response = await axios.get(
        `/api/special-request/student/${studentId}`
      );

      return response;
    } catch (error) {
      console.log(error);
    }
  }

  async setRequestInProgress(specialRequestId, formData) {
    try {
      const response = await axios.patch(
        `/api/special-request/in-progress/${specialRequestId}`,
        formData
      );

      return response;
    } catch (error) {
      console.log(error);
    }
  }

  async cancelSpecialRequest(specialRequestId, formData) {
    try {
      const response = await axios.patch(
        `/api/special-request/cancel/${specialRequestId}`,
        formData
      );

      return response;
    } catch (error) {
      console.log(error);
    }
  }

  async getCourseList() {
    try {
      const response = await axios.get(`/api/dcism_course_masterlist/`);
      return response;
    } catch (error) {
      console.log(error);
    }
  }
  async getCourseListIS() {
    try {
      const response = await axios.get(`/api/coursesIS/`);
      return response;
    } catch (error) {
      console.log(error);
    }
  }
  async getCourseListIT() {
    try {
      const response = await axios.get(`/api/coursesIT/`);
      return response;
    } catch (error) {
      console.log(error);
    }
  }

  async getCourseListCS() {
    try {
      const response = await axios.get(`/api/coursesCS/`);
      return response;
    } catch (error) {
      console.log(error);
    }
  }

  async getNotifications(id) {
    try {
      const response = await axios.get(`/api/notification/${id}`);

      return response;
    } catch (error) {
      console.log(error);
    }
  }

  async markNotificationRead(id, formData) {
    try {
      const response = await axios.patch(`/api/notification/${id}`, formData);

      return response;
    } catch (error) {
      console.log(error);
    }
  }

  async submitGrades(formData) {
    try {
      console.log(formData);
      const response = await axios.post("/api/grades/", formData);
      return response;
    } catch (error) {
      console.log(error);
    }
  }

  async getPerformanceReport() {
    try {
      const response = await axios.get("/api/performance-report/");
      return response;
    } catch (error) {
      console.log(error);
    }
  }

  async getGrades(id) {
    try {
      const response = await axios.get(`/api/grades/${id}`);
      return response;
    } catch (error) {
      console.log(error);
      return error;
    }
  }

  async saveGrades(formData) {
    try {
      const response = await axios.post("/api/grades/save", formData);
      return response;
    } catch (error) {
      console.log(error);
    }
  }

  async getSuggestedCourses(id) {
    try {
      const response = await axios.get(`/api/suggested-courses/${id}`);
      return response;
    } catch (error) {
      console.log(error);
    }
  }

  async getStudentStudyPlan(id) {
    try {
      const response = await axios.get(`/api/student-study-plan/${id}`);
      return response;
    } catch (error) {
      console.log(error);
    }
  }

  async addToStudyPlan(formData) {
    try {
      const response = await axios.patch(
        "/api/student-study-plan/add",
        formData
      );
      return response;
    } catch (error) {
      console.log(error);
    }
  }

  async removeFromStudyPlan(formData) {
    try {
      const response = await axios.patch(
        "/api/student-study-plan/remove",
        formData
      );
      return response;
    } catch (error) {
      console.log(error);
    }
  }

  async removeAllFromStudyPlan(formData) {
    try {
      const response = await axios.patch(
        "/api/student-study-plan/remove-all",
        formData
      );
      return response;
    } catch (error) {
      console.log(error);
    }
  }

  async getStudentStudyPlanBySem(semester, year, id) {
    try {
      const response = await axios.get(
        `/api/student-study-plan/student/${year}/${semester}/${id}`
      );
      return response;
    } catch (error) {
      console.log(error);
    }
  }

  async createStudyPlan(formData) {
    try {
      const response = await axios.post("/api/student-study-plan/", formData);
      return response;
    } catch (error) {
      console.log(error);
    }
  }

  async getProspectuses() {
    try {
      const response = await axios.get(`/api/prospectus/`);
      return response;
    } catch (error) {
      console.log(error);
    }
  }

  async getProspectus(program, effectiveYear) {
    try {
      const response = await axios.get(
        `/api/prospectus/${program}/${effectiveYear}`
      );
      return response;
    } catch (error) {
      console.log(error);
    }
  }

  async importStudentUsers(formData) {
    try {
      const response = await axios.post("/api/user", formData);
      return response;
    } catch (error) {
      console.log(error);
    }
  }

  async addFacultyUser(formData) {
    try {
      const response = await axios.post("/api/user/faculty", formData);
      return response;
    } catch (error) {
      console.log(error);
    }
  }

  async getByIdNumber(id) {
    try {
      const response = await axios.get(`/api/user/id/${id}`);
      return response;
    } catch (error) {
      console.log(error);
    }
  }

  async getCurrentSemester() {
    try {
      const response = await axios.get(`/api/semester/`);
      return response;
    } catch (error) {
      console.log(error);
    }
  }

  async createNewSemester(formData) {
    try {
      const response = await axios.post(`/api/semester/`, formData);
      return response;
    } catch (error) {
      console.log(error);
    }
  }

  async enableSpecialRequests(semesterId) {
    try {
      const response = await axios.patch(
        `/api/semester/enable-special-request/${semesterId}`
      );
      console.log(response);
      return response;
    } catch (error) {
      console.log(error);
    }
  }

  async disableSpecialRequests(semesterId) {
    try {
      const response = await axios.patch(
        `/api/semester/disable-special-request/${semesterId}`
      );
      return response;
    } catch (error) {
      console.log(error);
    }
  }

  async enablePetitions(semesterId) {
    try {
      const response = await axios.patch(
        `/api/semester/enable-petition/${semesterId}`
      );
      return response;
    } catch (error) {
      console.log(error);
    }
  }

  async disablePetitions(semesterId) {
    try {
      const response = await axios.patch(
        `/api/semester/disable-petition/${semesterId}`
      );
      return response;
    } catch (error) {
      console.log(error);
    }
  }

  async getSemesters() {
    try {
      const response = await axios.get(`/api/semester/all`);
      return response;
    } catch (error) {
      console.log(error);
    }
  }

  async getPetitionsBySemester(semester, year) {
    try {
      const response = await axios.get(
        `/api/petition/semester/${year}/${semester}`
      );
      return response;
    } catch (error) {
      console.log(error);
    }
  }

  async getSpecialRequestsBySemester(semester, year) {
    try {
      const response = await axios.get(
        `/api/special-request/semester/${year}/${semester}`
      );
      return response;
    } catch (error) {
      console.log(error);
    }
  }

  async getStudentSpecialRequestsBySem(semester, year, id) {
    try {
      const response = await axios.get(
        `/api/special-request/student/${year}/${semester}/${id}`
      );
      console.log(response)
      return response;
    } catch (error) {
      console.log(error);
    }
  }

  async updateStudentInfo(formData) {
    try {
      const response = await axios.patch("/api/user/student-update", formData);
      return response;
    } catch (error) {
      console.log(error);
    }
  }

  async verifyStudent(id) {
    try {
      const response = await axios.patch(`/api/user/verify-student/${id}`);
      return response;
    } catch (error) {
      console.log(error);
    }
  }

  async createCourseAccreditation(formData) {
    try {
      const response = await axios.patch("/api/grades/create-accredited", formData);
      return response;
    } catch (error) {
      console.log(error)
    }
  }

  async editCourseAccreditation(formData) {
    try {
      const response = await axios.patch("/api/grades/update-accredited", formData);
      return response;
    } catch (error) {
      console.log(error)
    }
  }

  async deleteCourseAccreditation(formData) {
    try {
      const response = await axios.patch("/api/grades/delete-accredited", formData);
      return response;
    } catch (error) {
      console.log(error)
    }
  }

  async getCourseOfferings(semester, year) {
    try {
      const response = await axios.get(`/api/course-offerings/semester/${semester}/${year}`);
      return response;
    } catch (error) {
      console.log(error);
    }
  }

  async getCurrentCourseOfferings() {
    try {
      const response = await axios.get('/api/course-offerings/');
      return response;
    } catch (error) {
      console.log(error);
    }
  }


  async getSpecialRequestsByProgram(program) {
    try {
      const response = await axios.get(`/api/special-request/per-program/${program}`);
      return response;
    } catch (error) {
      console.log(error);
    }
  }

  async getStudentPopulation() {
    try {
      const response = await axios.get('/api/student-population/');
      return response;
    } catch (error) {
      console.log(error);
    }
  }

  async getStudentsByProgram(program) {
    try {
      const response = await axios.get(`/api/user/${program}`);
      return response;
    } catch (error) {
      console.log(error);
    }
  }
}

export default new Api();
