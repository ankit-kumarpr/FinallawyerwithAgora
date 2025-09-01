import React, { useState, useEffect } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import LawyerCard from "./LawyerCard";
import LawyerProfileModal from "./LawyerProfileModal";

const specializationOptions = [
  "Criminal Law",
  "Civil Law",
  "Corporate Law",
  "Family Law",
  "Intellectual Property",
  "Cyber Law",
  "Tax Law",
  "Environmental Law",
  "Constitutional Law",
  "Labor Law",
];

const stateCityOptions = {
  Uttarakhand: ["Dehradun", "Haridwar", "Nainital", "New Tehri"],
  Delhi: ["New Delhi", "Dwarka", "Saket"],
  "Uttar Pradesh": ["Lucknow", "Noida", "Kanpur"],
  Maharashtra: ["Mumbai", "Pune", "Nagpur"],
  Karnataka: ["Bengaluru", "Mysuru", "Hubli"],
};

const FindLawyer = () => {
  const [lawyers, setLawyers] = useState([]);
  const [filteredLawyers, setFilteredLawyers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    specialization: "",
    state: "",
    city: "",
  });

  const [selectedLawyer, setSelectedLawyer] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLawyers = async () => {
      try {
        const response = await axios.get(
          "http://localhost:4000/lawapi/common/lwayerlist"
        );

        console.log("Fetched lawyers:", response.data);

        // Get the correct array from response.data.data
        const fetched = response.data.data;
        setLawyers(Array.isArray(fetched) ? fetched : []);
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to fetch lawyers:", error);
        toast.error("Failed to load lawyers.");
        setIsLoading(false);
      }
    };

    fetchLawyers();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const lawyerIdFromUrl = params.get("lawyerId");
    const serviceFromUrl = params.get("service");

    if (lawyerIdFromUrl && lawyers.length > 0) {
      const matchedLawyer = lawyers.find((l) => l._id === lawyerIdFromUrl);
      if (matchedLawyer) {
        setSelectedLawyer({
          ...matchedLawyer,
          requestedService: serviceFromUrl,
        });
        setShowModal(true);
      }
    }
  }, [location.search, lawyers]);

  useEffect(() => {
    let results = [...lawyers];

    if (filters.specialization) {
      results = results.filter(
        (l) =>
          l.specialization?.toLowerCase().trim() ===
          filters.specialization.toLowerCase().trim()
      );
    }

    if (filters.city) {
      results = results.filter(
        (l) =>
          l.city?.toLowerCase().trim() === filters.city.toLowerCase().trim()
      );
    }

    setFilteredLawyers(results);
  }, [filters, lawyers]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "state" ? { city: "" } : {}),
    }));
  };

  const resetFilters = () => {
    setFilters({ specialization: "", state: "", city: "" });
    setFilteredLawyers(lawyers);
  };

  const handleViewProfile = (lawyer) => {
    setSelectedLawyer(lawyer);
    setShowModal(true);
  };

  if (isLoading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "80vh" }}
      >
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <ToastContainer position="top-center" />
      <h1 className="text-center mb-5">Find a Lawyer</h1>

      {/* Filters */}
      <div className="card mb-4 shadow-sm">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <label htmlFor="specialization" className="form-label">
                Specialization
              </label>
              <select
                id="specialization"
                name="specialization"
                className="form-select"
                value={filters.specialization}
                onChange={handleFilterChange}
              >
                <option value="">All Specializations</option>
                {specializationOptions.map((spec, idx) => (
                  <option key={idx} value={spec}>
                    {spec}
                  </option>
                ))}
              </select>
            </div>
            {/* You can optionally re-enable state/city filters */}
            <div className="col-12 text-center">
              <button
                onClick={resetFilters}
                className="btn btn-outline-secondary me-2"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="mb-3">
        <h5>
          {filteredLawyers.length}{" "}
          {filteredLawyers.length === 1 ? "Lawyer" : "Lawyers"} Found
        </h5>
      </div>

      <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
        {filteredLawyers.length > 0 ? (
          filteredLawyers.map((lawyer) => (
            <div key={lawyer._id} className="col">
              <LawyerCard
                lawyer={lawyer}
                onViewProfile={() => handleViewProfile(lawyer)}
              />
            </div>
          ))
        ) : (
          <div className="col-12">
            <div className="alert alert-warning text-center">
              No lawyers found matching your criteria
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedLawyer && (
        <LawyerProfileModal
          show={showModal}
          handleClose={() => setShowModal(false)}
          lawyer={selectedLawyer}
        />
      )}
    </div>
  );
};

export default FindLawyer;
