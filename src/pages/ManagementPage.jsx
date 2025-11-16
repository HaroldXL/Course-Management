import { useState, useEffect } from "react";
import { Modal, Form, Input, DatePicker, Select, message, Spin } from "antd";
import dayjs from "dayjs";
import {
  BookOpen,
  Calendar,
  Users,
  Edit2,
  Plus,
  FileText,
  Eye,
  ClipboardList,
} from "lucide-react";
import subjectService from "../services/subjectService";
import semesterService from "../services/semesterService";
import examinerService from "../services/examinerService";
import examService from "../services/examService";
import rubricService from "../services/rubricService";
import submissionService from "../services/submissionService";
import "./ManagementPage.css";

const ManagementPage = () => {
  const [activeSection, setActiveSection] = useState("subjects");
  const [subjects, setSubjects] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [examiners, setExaminers] = useState([]);
  const [exams, setExams] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filterSemesterId, setFilterSemesterId] = useState(null);
  const [filterSubjectId, setFilterSubjectId] = useState(null);
  const [filterExamId, setFilterExamId] = useState(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  // Rubric modal states
  const [isRubricModalOpen, setIsRubricModalOpen] = useState(false);
  const [selectedExamRubrics, setSelectedExamRubrics] = useState([]);
  const [loadingRubrics, setLoadingRubrics] = useState(false);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection, filterSemesterId, filterSubjectId, filterExamId]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeSection === "subjects") {
        const response = await subjectService.getAll();
        if (response.isSuccess) {
          setSubjects(response.data);
        }
      } else if (activeSection === "semesters") {
        const response = await semesterService.getAll();
        if (response.isSuccess) {
          setSemesters(response.data);
        }
      } else if (activeSection === "examiners") {
        const response = await examinerService.getAll();
        if (response.isSuccess) {
          setExaminers(response.data);
        }
      } else if (activeSection === "exams") {
        // Load exams and also subjects/semesters for the form dropdowns
        const [examsResponse, subjectsResponse, semestersResponse] =
          await Promise.all([
            examService.getAll(filterSemesterId, filterSubjectId),
            subjectService.getAll(),
            semesterService.getAll(),
          ]);
        if (examsResponse.isSuccess) {
          setExams(examsResponse.data);
        }
        if (subjectsResponse.isSuccess) {
          setSubjects(subjectsResponse.data);
        }
        if (semestersResponse.isSuccess) {
          setSemesters(semestersResponse.data);
        }
      } else if (activeSection === "submissions") {
        // Load submissions and also exams/examiners for the dropdowns
        const [examsResponse, examinersResponse] = await Promise.all([
          examService.getAll(),
          examinerService.getAll(),
        ]);
        if (filterExamId) {
          const submissionsResponse = await submissionService.getByExamId(
            filterExamId
          );
          if (submissionsResponse.isSuccess) {
            setSubmissions(submissionsResponse.data);
          }
        } else {
          setSubmissions([]);
        }
        if (examsResponse.isSuccess) {
          setExams(examsResponse.data);
        }
        if (examinersResponse.isSuccess) {
          setExaminers(examinersResponse.data);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getFilteredData = () => {
    if (activeSection === "subjects") {
      return subjects;
    } else if (activeSection === "semesters") {
      return semesters;
    } else if (activeSection === "examiners") {
      return examiners;
    } else if (activeSection === "exams") {
      return exams;
    } else if (activeSection === "submissions") {
      return submissions;
    }
    return [];
  };

  const handleAdd = () => {
    setEditingItem(null);
    setIsModalOpen(true);
    form.resetFields();
  };

  const handleEdit = async (item) => {
    setEditingItem(item);
    setIsModalOpen(true);

    if (activeSection === "subjects") {
      form.setFieldsValue({
        code: item.code,
        name: item.name,
      });
    } else if (activeSection === "semesters") {
      form.setFieldsValue({
        name: item.name,
        startDate: dayjs(item.startDate),
        endDate: dayjs(item.endDate),
      });
    } else if (activeSection === "examiners") {
      form.setFieldsValue({
        fullName: item.fullName,
        email: item.email,
      });
    } else if (activeSection === "exams") {
      form.setFieldsValue({
        title: item.title,
        subjectId: item.subjectId,
        semesterId: item.semesterId,
        startTime: dayjs(item.startTime),
        endTime: dayjs(item.endTime),
        status: item.status,
      });
    } else if (activeSection === "submissions") {
      form.setFieldsValue({
        examId: item.examId,
        studentCode: item.studentCode,
        fileUrl: item.fileUrl,
        status: item.status,
        totalScore: item.totalScore,
        examinerId: item.examinerId,
      });
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    form.resetFields();
  };

  const handleViewRubrics = async (exam) => {
    setLoadingRubrics(true);
    setIsRubricModalOpen(true);
    try {
      const response = await rubricService.getByExamId(exam.id);
      if (response.isSuccess) {
        setSelectedExamRubrics(response.data);
      } else {
        message.error("Không thể tải đánh giá: " + response.message);
      }
    } catch (err) {
      message.error("Không thể tải đánh giá: " + err.message);
      setSelectedExamRubrics([]);
    } finally {
      setLoadingRubrics(false);
    }
  };

  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      if (editingItem) {
        // Update existing item
        if (activeSection === "subjects") {
          await subjectService.update(editingItem.id, {
            code: values.code,
            name: values.name,
          });
          message.success("Cập nhật môn học thành công!");
        } else if (activeSection === "semesters") {
          await semesterService.update(editingItem.id, {
            name: values.name,
            startDate: values.startDate.format("YYYY-MM-DD"),
            endDate: values.endDate.format("YYYY-MM-DD"),
          });
          message.success("Cập nhật học kỳ thành công!");
        } else if (activeSection === "examiners") {
          await examinerService.update(editingItem.id, {
            fullName: values.fullName,
            email: values.email,
          });
          message.success("Cập nhật giám khảo thành công!");
        } else if (activeSection === "exams") {
          await examService.update(editingItem.id, {
            title: values.title,
            subjectId: values.subjectId,
            semesterId: values.semesterId,
            startTime: values.startTime.format("YYYY-MM-DDTHH:mm:ss"),
            endTime: values.endTime.format("YYYY-MM-DDTHH:mm:ss"),
            status: values.status || "",
          });
          message.success("Cập nhật bài thi thành công!");
        } else if (activeSection === "submissions") {
          await submissionService.update(editingItem.id, {
            examId: values.examId,
            studentCode: values.studentCode,
            fileUrl: values.fileUrl,
            status: values.status,
            totalScore: values.totalScore || null,
            examinerId: values.examinerId || null,
          });
          message.success("Cập nhật bài nộp thành công!");
        }
      } else {
        // Create new item
        if (activeSection === "subjects") {
          await subjectService.create({
            code: values.code,
            name: values.name,
          });
          message.success("Thêm môn học thành công!");
        } else if (activeSection === "semesters") {
          await semesterService.create({
            name: values.name,
            startDate: values.startDate.format("YYYY-MM-DD"),
            endDate: values.endDate.format("YYYY-MM-DD"),
          });
          message.success("Thêm học kỳ thành công!");
        } else if (activeSection === "examiners") {
          await examinerService.create({
            fullName: values.fullName,
            email: values.email,
          });
          message.success("Thêm giám khảo thành công!");
        } else if (activeSection === "exams") {
          await examService.create({
            title: values.title,
            subjectId: values.subjectId,
            semesterId: values.semesterId,
            startTime: values.startTime.format("YYYY-MM-DDTHH:mm:ss"),
            endTime: values.endTime.format("YYYY-MM-DDTHH:mm:ss"),
            status: values.status || "",
          });
          message.success("Thêm bài thi thành công!");
        } else if (activeSection === "submissions") {
          await submissionService.create({
            examId: values.examId,
            studentCode: values.studentCode,
            fileUrl: values.fileUrl,
            status: values.status,
            totalScore: values.totalScore || null,
            examinerId: values.examinerId || null,
          });
          message.success("Thêm bài nộp thành công!");
        }
      }

      handleModalClose();
      loadData();
    } catch (err) {
      message.error(
        (editingItem ? "Cập nhật" : "Thêm mới") + " thất bại: " + err.message
      );
    } finally {
      setSubmitting(false);
    }
  };

  const getModalTitle = () => {
    const action = editingItem ? "Chỉnh sửa" : "Thêm mới";
    if (activeSection === "subjects") return `${action} môn học`;
    if (activeSection === "semesters") return `${action} học kỳ`;
    if (activeSection === "examiners") return `${action} giám khảo`;
    if (activeSection === "exams") return `${action} bài thi`;
    if (activeSection === "submissions") return `${action} bài nộp`;
    return action;
  };

  return (
    <div className="management-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>Trang Quản Lý</h2>
        </div>
        <nav className="sidebar-nav">
          <button
            className={`nav-item ${
              activeSection === "subjects" ? "active" : ""
            }`}
            onClick={() => setActiveSection("subjects")}
          >
            <BookOpen size={18} />
            <span>Quản lý môn học</span>
          </button>
          <button
            className={`nav-item ${
              activeSection === "semesters" ? "active" : ""
            }`}
            onClick={() => setActiveSection("semesters")}
          >
            <Calendar size={18} />
            <span>Quản lý học kỳ</span>
          </button>
          <button
            className={`nav-item ${
              activeSection === "examiners" ? "active" : ""
            }`}
            onClick={() => setActiveSection("examiners")}
          >
            <Users size={18} />
            <span>Quản lý giám khảo</span>
          </button>
          <button
            className={`nav-item ${activeSection === "exams" ? "active" : ""}`}
            onClick={() => setActiveSection("exams")}
          >
            <FileText size={18} />
            <span>Quản lý bài thi</span>
          </button>
          <button
            className={`nav-item ${
              activeSection === "submissions" ? "active" : ""
            }`}
            onClick={() => setActiveSection("submissions")}
          >
            <ClipboardList size={18} />
            <span>Quản lý bài nộp</span>
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Header */}
        <div className="page-header">
          <div className="header-left">
            <div className="header-icon">
              {activeSection === "subjects" && <BookOpen size={24} />}
              {activeSection === "semesters" && <Calendar size={24} />}
              {activeSection === "examiners" && <Users size={24} />}
              {activeSection === "exams" && <FileText size={24} />}
              {activeSection === "submissions" && <ClipboardList size={24} />}
            </div>
            <div>
              <h1>
                {activeSection === "subjects" && "Quản lý môn học"}
                {activeSection === "semesters" && "Quản lý học kỳ"}
                {activeSection === "examiners" && "Quản lý giám khảo"}
                {activeSection === "exams" && "Quản lý bài thi"}
                {activeSection === "submissions" && "Quản lý bài nộp"}
              </h1>
              <p className="subtitle">
                Tổng số {getFilteredData().length}{" "}
                {activeSection === "subjects"
                  ? "môn học"
                  : activeSection === "semesters"
                  ? "học kỳ"
                  : activeSection === "examiners"
                  ? "giám khảo"
                  : activeSection === "submissions"
                  ? "bài nộp"
                  : "bài thi"}
              </p>
            </div>
          </div>
          <button className="btn-add" onClick={handleAdd}>
            <Plus size={18} />
            <span>Thêm mới</span>
          </button>
        </div>

        {/* Filter Bar for Exams */}
        {activeSection === "exams" && (
          <div
            className="filter-bar"
            style={{ display: "flex", gap: "10px", marginBottom: "20px" }}
          >
            <Select
              placeholder="Lọc theo môn học"
              allowClear
              style={{ width: 200 }}
              onChange={(value) => setFilterSubjectId(value || null)}
              value={filterSubjectId}
              options={[
                { label: "Tất cả môn học", value: null },
                ...subjects.map((s) => ({
                  label: `${s.code} - ${s.name}`,
                  value: s.id,
                })),
              ]}
            />
            <Select
              placeholder="Lọc theo học kỳ"
              allowClear
              style={{ width: 200 }}
              onChange={(value) => setFilterSemesterId(value || null)}
              value={filterSemesterId}
              options={[
                { label: "Tất cả học kỳ", value: null },
                ...semesters.map((s) => ({
                  label: s.name,
                  value: s.id,
                })),
              ]}
            />
          </div>
        )}

        {/* Filter Bar for Submissions */}
        {activeSection === "submissions" && (
          <div
            className="filter-bar"
            style={{
              display: "flex",
              gap: "10px",
              marginBottom: "20px",
            }}
          >
            <Select
              placeholder="Chọn bài thi để xem bài nộp"
              size="large"
              style={{ width: 600, fontSize: "20px", fontWeight: "700" }}
              onChange={(value) => setFilterExamId(value)}
              value={filterExamId}
              options={exams.map((e) => ({
                label: `${e.title} - ${e.subjectCode} - ${e.subjectName} - ${e.semesterName}`,
                value: e.id,
              }))}
            />
          </div>
        )}

        {/* Data Section */}
        <div className="data-section">
          <h3 className="section-title">Danh sách dữ liệu</h3>

          {loading && (
            <div className="loading">
              <Spin size="large" />
            </div>
          )}
          {error && <div className="error">Lỗi: {error}</div>}

          {!loading && !error && (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    {activeSection === "subjects" && (
                      <>
                        <th>MÃ MÔN</th>
                        <th>TÊN MÔN HỌC</th>
                      </>
                    )}
                    {activeSection === "semesters" && (
                      <>
                        <th>HỌC KỲ</th>
                        <th>NGÀY BẮT ĐẦU</th>
                        <th>NGÀY KẾT THÚC</th>
                      </>
                    )}
                    {activeSection === "examiners" && (
                      <>
                        <th>HỌ TÊN</th>
                        <th>EMAIL</th>
                      </>
                    )}
                    {activeSection === "exams" && (
                      <>
                        <th>TIÊU ĐỀ</th>
                        <th>MÔN HỌC</th>
                        <th>HỌC KỲ</th>
                        <th>THỜI GIAN BẮT ĐẦU</th>
                        <th>THỜI GIAN KẾT THÚC</th>
                      </>
                    )}
                    {activeSection === "submissions" && (
                      <>
                        <th>MÃ SINH VIÊN</th>
                        <th>FILE</th>
                        <th>TRẠNG THÁI</th>
                        <th>ĐIỂM</th>
                        <th>GIÁM KHẢO</th>
                      </>
                    )}
                    <th>THAO TÁC</th>
                  </tr>
                </thead>
                <tbody>
                  {activeSection === "subjects" &&
                    getFilteredData().map((item, index) => (
                      <tr key={item.id}>
                        <td>#{index + 1}</td>
                        <td>
                          <span className="badge badge-code">{item.code}</span>
                        </td>
                        <td>{item.name}</td>
                        <td>
                          <button
                            className="btn-icon btn-edit"
                            onClick={() => handleEdit(item)}
                            style={{
                              backgroundColor: "#93c5fd",
                              color: "white",
                              borderRadius: "8px",
                            }}
                          >
                            <Edit2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  {activeSection === "semesters" &&
                    getFilteredData().map((item, index) => (
                      <tr key={item.id}>
                        <td>#{index + 1}</td>
                        <td>
                          <strong>{item.name}</strong>
                        </td>
                        <td>{formatDate(item.startDate)}</td>
                        <td>{formatDate(item.endDate)}</td>
                        <td>
                          <button
                            className="btn-icon btn-edit"
                            onClick={() => handleEdit(item)}
                            style={{
                              backgroundColor: "#93c5fd",
                              color: "white",
                              borderRadius: "8px",
                            }}
                          >
                            <Edit2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  {activeSection === "examiners" &&
                    getFilteredData().map((item, index) => (
                      <tr key={item.id}>
                        <td>#{index + 1}</td>
                        <td>
                          <div className="user-cell">
                            <div className="user-avatar">
                              {item.fullName.charAt(0)}
                            </div>
                            <span>{item.fullName}</span>
                          </div>
                        </td>
                        <td>{item.email}</td>
                        <td>
                          <button
                            className="btn-icon btn-edit"
                            onClick={() => handleEdit(item)}
                            style={{
                              backgroundColor: "#93c5fd",
                              color: "white",
                              borderRadius: "8px",
                            }}
                          >
                            <Edit2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  {activeSection === "exams" &&
                    getFilteredData().map((item, index) => (
                      <tr key={item.id}>
                        <td>#{index + 1}</td>
                        <td>
                          <strong>{item.title}</strong>
                        </td>
                        <td>
                          <span className="badge badge-code">
                            {item.subjectCode}
                          </span>
                        </td>
                        <td>{item.semesterName}</td>
                        <td>{formatDateTime(item.startTime)}</td>
                        <td>{formatDateTime(item.endTime)}</td>
                        <td>
                          <button
                            className="btn-icon"
                            onClick={() => handleViewRubrics(item)}
                            style={{
                              backgroundColor: "#6ee7b7",
                              color: "white",
                              borderRadius: "8px",
                            }}
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            className="btn-icon btn-edit"
                            onClick={() => handleEdit(item)}
                            style={{
                              backgroundColor: "#93c5fd",
                              color: "white",
                              borderRadius: "8px",
                            }}
                          >
                            <Edit2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  {activeSection === "submissions" &&
                    getFilteredData().map((item, index) => (
                      <tr key={item.id}>
                        <td>#{index + 1}</td>
                        <td>
                          <strong>{item.studentCode}</strong>
                        </td>
                        <td>
                          <a
                            href={item.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: "#1890ff" }}
                          >
                            {item.fileUrl}
                          </a>
                        </td>
                        <td>
                          <span
                            className="badge"
                            style={{
                              backgroundColor:
                                item.status === "GRADED"
                                  ? "#10b981"
                                  : item.status === "UPLOADED"
                                  ? "#f59e0b"
                                  : "#6b7280",
                              color: "white",
                              padding: "4px 12px",
                              borderRadius: "4px",
                              fontSize: "12px",
                            }}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td>
                          <strong
                            style={{
                              color: item.totalScore ? "#10b981" : "#999",
                            }}
                          >
                            {item.totalScore !== null ? item.totalScore : "-"}
                          </strong>
                        </td>
                        <td>{item.examinerName || "-"}</td>
                        <td>
                          <button
                            className="btn-icon btn-edit"
                            onClick={() => handleEdit(item)}
                            style={{
                              backgroundColor: "#93c5fd",
                              color: "white",
                              borderRadius: "8px",
                            }}
                          >
                            <Edit2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <Modal
        title={getModalTitle()}
        open={isModalOpen}
        onOk={form.submit}
        onCancel={handleModalClose}
        okText={editingItem ? "Cập nhật" : "Thêm mới"}
        cancelText="Hủy"
        width={500}
        confirmLoading={submitting}
        centered
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          style={{ marginTop: 20 }}
        >
          {activeSection === "subjects" && (
            <>
              <Form.Item
                label="Mã môn học"
                name="code"
                rules={[
                  { required: true, message: "Vui lòng nhập mã môn học!" },
                ]}
              >
                <Input placeholder="VD: MATH101" />
              </Form.Item>
              <Form.Item
                label="Tên môn học"
                name="name"
                rules={[
                  { required: true, message: "Vui lòng nhập tên môn học!" },
                ]}
              >
                <Input placeholder="VD: Mathematics 1" />
              </Form.Item>
            </>
          )}

          {activeSection === "semesters" && (
            <>
              <Form.Item
                label="Tên học kỳ"
                name="name"
                rules={[
                  { required: true, message: "Vui lòng nhập tên học kỳ!" },
                ]}
              >
                <Input placeholder="VD: Fall25" />
              </Form.Item>
              <Form.Item
                label="Ngày bắt đầu"
                name="startDate"
                rules={[
                  { required: true, message: "Vui lòng chọn ngày bắt đầu!" },
                ]}
              >
                <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
              </Form.Item>
              <Form.Item
                label="Ngày kết thúc"
                name="endDate"
                rules={[
                  { required: true, message: "Vui lòng chọn ngày kết thúc!" },
                ]}
              >
                <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
              </Form.Item>
            </>
          )}

          {activeSection === "examiners" && (
            <>
              <Form.Item
                label="Họ tên"
                name="fullName"
                rules={[{ required: true, message: "Vui lòng nhập họ tên!" }]}
              >
                <Input placeholder="VD: Nguyen Van A" />
              </Form.Item>
              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { required: true, message: "Vui lòng nhập email!" },
                  { type: "email", message: "Email không hợp lệ!" },
                ]}
              >
                <Input placeholder="VD: nguyenvana@example.com" />
              </Form.Item>
            </>
          )}

          {activeSection === "exams" && (
            <>
              <Form.Item
                label="Tiêu đề"
                name="title"
                rules={[
                  { required: true, message: "Vui lòng nhập tiêu đề bài thi!" },
                ]}
              >
                <Input placeholder="VD: Midterm Exam" />
              </Form.Item>
              <Form.Item
                label="Môn học"
                name="subjectId"
                rules={[{ required: true, message: "Vui lòng chọn môn học!" }]}
              >
                <Select
                  placeholder="Chọn môn học"
                  options={subjects.map((s) => ({
                    label: `${s.code} - ${s.name}`,
                    value: s.id,
                  }))}
                />
              </Form.Item>
              <Form.Item
                label="Học kỳ"
                name="semesterId"
                rules={[{ required: true, message: "Vui lòng chọn học kỳ!" }]}
              >
                <Select
                  placeholder="Chọn học kỳ"
                  options={semesters.map((s) => ({
                    label: s.name,
                    value: s.id,
                  }))}
                />
              </Form.Item>
              <Form.Item
                label="Thời gian bắt đầu"
                name="startTime"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng chọn thời gian bắt đầu!",
                  },
                ]}
              >
                <DatePicker
                  showTime
                  format="DD/MM/YYYY HH:mm"
                  style={{ width: "100%" }}
                  placeholder="Chọn thời gian bắt đầu"
                />
              </Form.Item>
              <Form.Item
                label="Thời gian kết thúc"
                name="endTime"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng chọn thời gian kết thúc!",
                  },
                ]}
              >
                <DatePicker
                  showTime
                  format="DD/MM/YYYY HH:mm"
                  style={{ width: "100%" }}
                  placeholder="Chọn thời gian kết thúc"
                />
              </Form.Item>
              <Form.Item label="Trạng thái" name="status">
                <Input placeholder="VD: Active, Completed, etc." />
              </Form.Item>
            </>
          )}

          {activeSection === "submissions" && (
            <>
              <Form.Item
                label="Bài thi"
                name="examId"
                rules={[{ required: true, message: "Vui lòng chọn bài thi!" }]}
              >
                <Select
                  placeholder="Chọn bài thi"
                  options={exams.map((e) => ({
                    label: `${e.title} - ${e.subjectCode}`,
                    value: e.id,
                  }))}
                />
              </Form.Item>
              <Form.Item
                label="Mã sinh viên"
                name="studentCode"
                rules={[
                  { required: true, message: "Vui lòng nhập mã sinh viên!" },
                ]}
              >
                <Input placeholder="VD: S001" />
              </Form.Item>
              <Form.Item
                label="File URL"
                name="fileUrl"
                rules={[{ required: true, message: "Vui lòng nhập file URL!" }]}
              >
                <Input placeholder="VD: file1.pdf" />
              </Form.Item>
              <Form.Item
                label="Trạng thái"
                name="status"
                rules={[
                  { required: true, message: "Vui lòng chọn trạng thái!" },
                ]}
              >
                <Select
                  placeholder="Chọn trạng thái"
                  options={[
                    { label: "UPLOADED", value: "UPLOADED" },
                    { label: "GRADED", value: "GRADED" },
                  ]}
                />
              </Form.Item>
              <Form.Item label="Điểm" name="totalScore">
                <Input type="number" placeholder="VD: 85.5" />
              </Form.Item>
              <Form.Item label="Giám khảo" name="examinerId">
                <Select
                  placeholder="Chọn giám khảo"
                  allowClear
                  options={examiners.map((e) => ({
                    label: e.fullName,
                    value: e.id,
                  }))}
                />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>

      {/* Rubric Modal */}
      <Modal
        title="Tiêu chí chấm điểm"
        open={isRubricModalOpen}
        onCancel={() => setIsRubricModalOpen(false)}
        footer={null}
        width={800}
        centered
      >
        {loadingRubrics ? (
          <div className="loading">
            <Spin size="large" />
          </div>
        ) : selectedExamRubrics.length > 0 ? (
          <div>
            {selectedExamRubrics.map((rubric) => (
              <div key={rubric.id} style={{ marginBottom: "30px" }}>
                <h3 style={{ marginBottom: "15px", color: "#1890ff" }}>
                  {rubric.name}
                </h3>
                <p style={{ marginBottom: "10px", color: "#666" }}>
                  <strong>Bài thi:</strong> {rubric.examTitle}
                </p>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    marginTop: "10px",
                  }}
                >
                  <thead>
                    <tr style={{ backgroundColor: "#f5f5f5" }}>
                      <th
                        style={{
                          padding: "10px",
                          border: "1px solid #ddd",
                          textAlign: "left",
                        }}
                      >
                        STT
                      </th>
                      <th
                        style={{
                          padding: "10px",
                          border: "1px solid #ddd",
                          textAlign: "left",
                        }}
                      >
                        Tiêu chí
                      </th>
                      <th
                        style={{
                          padding: "10px",
                          border: "1px solid #ddd",
                          textAlign: "center",
                        }}
                      >
                        Điểm tối đa
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rubric.rubricCriteria.map((criteria, index) => (
                      <tr key={criteria.id}>
                        <td
                          style={{ padding: "10px", border: "1px solid #ddd" }}
                        >
                          {index + 1}
                        </td>
                        <td
                          style={{ padding: "10px", border: "1px solid #ddd" }}
                        >
                          {criteria.criterionName}
                        </td>
                        <td
                          style={{
                            padding: "10px",
                            border: "1px solid #ddd",
                            textAlign: "center",
                            fontWeight: "bold",
                          }}
                        >
                          {criteria.maxScore}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ backgroundColor: "#f5f5f5" }}>
                      <td
                        colSpan="2"
                        style={{
                          padding: "10px",
                          border: "1px solid #ddd",
                          textAlign: "right",
                          fontWeight: "bold",
                        }}
                      >
                        Tổng điểm:
                      </td>
                      <td
                        style={{
                          padding: "10px",
                          border: "1px solid #ddd",
                          textAlign: "center",
                          fontWeight: "bold",
                          color: "#1890ff",
                        }}
                      >
                        {rubric.rubricCriteria.reduce(
                          (sum, criteria) => sum + criteria.maxScore,
                          0
                        )}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "20px", color: "#999" }}>
            Không có đánh giá nào cho bài thi này
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ManagementPage;
