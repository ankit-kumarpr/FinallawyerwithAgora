import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const AdminLawyerManagement = () => {
  const [lawyers, setLawyers] = useState([]);
  const [formData, setFormData] = useState({
    lawyerId: "",
    name: "",
    email: "",
    phone: "",
    city: "",
    licenseNumber: "",
    specialization: "",
    consultation_fees: 0,
    experience: 0,
    practiceArea: "",
    profileDescription: "",
    status: "online",
    isverified: true,
  });
  const [education, setEducation] = useState([""]);
  const [lawyerImage, setLawyerImage] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchLawyers();
  }, []);

  const fetchLawyers = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(
        "http://localhost:4000/lawapi/physical-lawyers/getphylawyers"
      );
      const data = res?.data;
      const lawyersList = Array.isArray(data) ? data : data?.data;

      if (Array.isArray(lawyersList)) {
        setLawyers(lawyersList);
      } else {
        console.error("Unexpected response format:", data);
        setLawyers([]);
      }
    } catch (err) {
      console.error("Failed to fetch lawyers:", err);
      setError("Error fetching lawyer data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEducationChange = (index, value) => {
    const updated = [...education];
    updated[index] = value;
    setEducation(updated);
  };

  const addEducationField = () => setEducation([...education, ""]);
  const removeEducationField = (index) =>
    setEducation(education.filter((_, i) => i !== index));
  const handleImageChange = (e) => setLawyerImage(e.target.files[0]);

  //  console.log('formData before submit:', formData);
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Attach education as JSON string
    const payload = { ...formData, education: JSON.stringify(education) };

    try {
      if (editingId) {
        // EDIT MODE
        const response = await axios.post(
          `http://localhost:4000/lawapi/physical-lawyers/updatelawyer/${editingId}`,
          payload
        );
        toast.success("Lawyer updated successfully");
      } else {
        // ADD MODE
        const response = await axios.post(
          "http://localhost:4000/lawapi/physical-lawyers/add-lawyer",
          payload
        );
        toast.success("Lawyer added successfully");
      }

      fetchLawyers();
      resetForm();
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save lawyer");
    }
  };

  const editLawyer = (lawyer) => {
    setFormData({
      _id: lawyer._id, // ✅ Add this line
      lawyerId: lawyer.lawyerId || "",
      name: lawyer.name || "",
      email: lawyer.email || "",
      phone: lawyer.phone || "",
      city: lawyer.city || "",
      licenseNumber: lawyer.licenseNumber || "",
      specialization: lawyer.specialization || "",
      consultation_fees: lawyer.consultation_fees || 0,
      experience: lawyer.experience || 0,
      practiceArea: lawyer.practiceArea || "",
      profileDescription: lawyer.profileDescription || "",
      status: lawyer.status || "online",
      isverified: lawyer.isverified || false,
    });

    try {
      const parsedEducation =
        typeof lawyer.education === "string"
          ? JSON.parse(lawyer.education)
          : lawyer.education;

      setEducation(
        Array.isArray(parsedEducation)
          ? parsedEducation
          : [parsedEducation || ""]
      );
    } catch {
      setEducation([""]);
    }

    setEditingId(lawyer._id);
  };

  const deleteLawyer = async (id) => {
    if (!window.confirm("Are you sure you want to delete this lawyer?")) return;
    setIsLoading(true);
    try {
      await axios.delete(
        `http://localhost:4000/lawapi/physical-lawyers/dellawyer/${id}`
      );
      toast.success("Lawyer deleted");
      fetchLawyers();
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Failed to delete lawyer");
    } finally {
      setIsLoading(false);
    }
  };
  const resetForm = () => {
    setFormData({
      _id: "", // include this
      lawyerId: "",
      name: "",
      email: "",
      phone: "",
      city: "",
      licenseNumber: "",
      specialization: "",
      consultation_fees: 0,
      experience: 0,
      practiceArea: "",
      profileDescription: "",
      status: "online",
      isverified: true,
    });
    setEducation([""]);
    setLawyerImage(null);
    setEditingId(null);
  };

  return (
    <div className="container">
      <ToastContainer />

      {/* === Lawyer Form === */}
      <div className="card mt-4">
        <div className="card-header">
          <h5>{editingId ? "Edit Lawyer" : "Add New Lawyer"}</h5>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            {/* Basic Inputs */}
            <div className="row">
              {[
                { label: "Lawyer ID", name: "lawyerId" },
                { label: "Full Name", name: "name" },
                { label: "Email", name: "email", type: "email" },
                { label: "Phone", name: "phone" },
                { label: "City", name: "city" },
                { label: "License Number", name: "licenseNumber" },
              ].map((field, i) => (
                <div className="col-md-4 mb-3" key={i}>
                  <label>{field.label}</label>
                  <input
                    type={field.type || "text"}
                    className="form-control"
                    name={field.name}
                    value={formData[field.name]}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              ))}
            </div>

            {/* Dropdowns */}
            <div className="row">
              <div className="col-md-4 mb-3">
                <label>Specialization</label>
                <select
                  className="form-control"
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select</option>
                  <option value="Criminal Law">Criminal Law</option>
                  <option value="Family Law">Family Law</option>
                  <option value="Corporate Law">Corporate Law</option>
                  <option value="Immigration Law">Immigration Law</option>
                  <option value="Intellectual Property">
                    Intellectual Property
                  </option>
                </select>
              </div>
              <div className="col-md-4 mb-3">
                <label>Practice Area</label>
                <select
                  className="form-control"
                  name="practiceArea"
                  value={formData.practiceArea}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select</option>
                  <option value="Tax Law">Tax Law</option>
                  <option value="Labour & Employment Law">
                    Labour & Employment Law
                  </option>
                  <option value="Banking & Finance Law">
                    Banking & Finance Law
                  </option>
                  <option value="Cyber & IT Law">Cyber & IT Law</option>
                  <option value="Environmental Law">Environmental Law</option>
                  <option value="Insurance Law">Insurance Law</option>
                  <option value="Documentary Drafting & Legal Documentation">
                    Documentary Drafting & Legal Documentation
                  </option>
                </select>
              </div>
              <div className="col-md-4 mb-3">
                <label>Status</label>
                <select
                  className="form-control"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                >
                  <option value="online">Online</option>
                  <option value="offline">Offline</option>
                  <option value="busy">Busy</option>
                </select>
              </div>
            </div>

            {/* Numbers */}
            <div className="row">
              <div className="col-md-6 mb-3">
                <label>Consultation Fees (₹/minute)</label>
                <input
                  type="number"
                  name="consultation_fees"
                  value={formData.consultation_fees}
                  onChange={handleInputChange}
                  className="form-control"
                />
              </div>
              <div className="col-md-6 mb-3">
                <label>Experience (years)</label>
                <input
                  type="number"
                  name="experience"
                  value={formData.experience}
                  onChange={handleInputChange}
                  className="form-control"
                />
              </div>
            </div>

            {/* Profile Description */}
            <div className="mb-3">
              <label>Profile Description</label>
              <textarea
                className="form-control"
                name="profileDescription"
                rows="3"
                value={formData.profileDescription}
                onChange={handleInputChange}
              />
            </div>

            {/* Education Fields */}
            <div className="mb-3">
              <label>Education</label>
              {education.map((edu, index) => (
                <div key={index} className="input-group mb-2">
                  <input
                    type="text"
                    className="form-control"
                    value={edu}
                    onChange={(e) =>
                      handleEducationChange(index, e.target.value)
                    }
                  />
                  {index > 0 && (
                    <button
                      type="button"
                      className="btn btn-outline-danger"
                      onClick={() => removeEducationField(index)}
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                className="btn btn-sm btn-outline-primary"
                onClick={addEducationField}
              >
                Add Education
              </button>
            </div>

            {/* Image Upload */}
            <div className="mb-3">
              <label>Profile Image</label>
              <input
                type="file"
                className="form-control-file"
                accept="image/*"
                onChange={handleImageChange}
              />
            </div>

            {/* Verified */}
            <div className="form-check mb-3">
              <input
                type="checkbox"
                className="form-check-input"
                name="isverified"
                checked={formData.isverified}
                onChange={(e) =>
                  setFormData({ ...formData, isverified: e.target.checked })
                }
              />
              <label className="form-check-label">Verified</label>
            </div>

            {/* Buttons */}
            <div className="text-center">
              <button
                className="btn btn-primary me-2"
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? "Saving..." : editingId ? "Update" : "Add"}
              </button>
              <button
                className="btn btn-secondary"
                type="button"
                onClick={resetForm}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* === Lawyer Table === */}
      <div className="card mt-4">
        <div className="card-header">
          <h5>Lawyers List</h5>
        </div>
        <div className="card-body">
          {isLoading ? (
            <div className="text-center">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>ID</th>
                    <th>City</th>
                    <th>Status</th>
                    <th>Fees</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {lawyers.map((lawyer) => (
                    <tr key={lawyer._id}>
                      <td>{lawyer.name}</td>
                      <td>{lawyer.lawyerId}</td>
                      <td>{lawyer.city}</td>
                      <td>{lawyer.status}</td>
                      <td>₹{lawyer.consultation_fees}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-info me-2"
                          onClick={() => editLawyer(lawyer)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => deleteLawyer(lawyer._id)}
                        >
                          Delete
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
    </div>
  );
};

export default AdminLawyerManagement;
