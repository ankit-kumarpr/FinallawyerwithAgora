import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../components/AuthContext";
import styled from "styled-components";
import {
  FaUserTie,
  FaClock,
  FaMoneyBillWave,
  FaCheckCircle,
  FaTimesCircle,
  FaSearch,
} from "react-icons/fa";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ClientHistoryPage = () => {
  const [consultations, setConsultations] = useState([]);
  const [filteredConsultations, setFilteredConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const auth = useAuth();
  const currentUser = auth?.currentUser;

  useEffect(() => {
    const fetchConsultationHistory = async () => {
      try {
        const token = sessionStorage.getItem("token");
        const response = await axios.get(
          `http://localhost:4000/lawapi/common/userhistory/${currentUser?.userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        console.log("API response:", response.data);

        const data = response.data;

        if (Array.isArray(data)) {
          setConsultations(data);
          setFilteredConsultations(data);
        } else if (data && typeof data === "object") {
          setConsultations([data]);
          setFilteredConsultations([data]);
        } else {
          throw new Error("Invalid data format received");
        }
      } catch (err) {
        console.error("Error fetching consultation history:", err);
        setError("Failed to load consultation history");
        toast.error("Failed to load consultation history");
      } finally {
        setLoading(false);
      }
    };

    fetchConsultationHistory();
  }, [currentUser?.userId]);

  // Apply search filter whenever searchTerm or consultations change
  useEffect(() => {
    const filtered = consultations.filter((consultation) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        consultation.lawyer?.name?.toLowerCase().includes(searchLower) ||
        consultation.lawyer?.specialization
          ?.toLowerCase()
          .includes(searchLower) ||
        consultation.transaction?.paymentId
          ?.toLowerCase()
          .includes(searchLower) ||
        consultation.transaction?.status?.toLowerCase().includes(searchLower) ||
        formatDate(consultation.transaction?.createdAt)
          .toLowerCase()
          .includes(searchLower)
      );
    });
    setFilteredConsultations(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  }, [searchTerm, consultations]);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Get current items for pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredConsultations.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredConsultations.length / itemsPerPage);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) {
    return (
      <PageContainer>
        <LoadingSpinner />
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <ErrorMessage>{error}</ErrorMessage>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Header>
        <h1>Consultation History</h1>
        <p>Review your past legal consultations</p>
      </Header>

      <SearchContainer>
        <SearchInput
          type="text"
          placeholder="Search by lawyer name, specialty, date, or transaction ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <SearchIcon>
          <FaSearch />
        </SearchIcon>
      </SearchContainer>

      {filteredConsultations.length === 0 ? (
        <EmptyState>
          <EmptyStateIcon />
          <h3>No Matching Consultations Found</h3>
          <p>
            {searchTerm
              ? "Try a different search term"
              : "You haven't had any consultations yet."}
          </p>
        </EmptyState>
      ) : (
        <>
          <ConsultationList>
            {currentItems.map((consultation, index) => (
              <ConsultationCard key={index}>
                <LawyerInfo>
                  <LawyerAvatar>
                    <FaUserTie />
                  </LawyerAvatar>
                  <div>
                    <LawyerName>
                      {consultation.lawyer?.name || "N/A"}
                    </LawyerName>
                    <LawyerSpecialty>
                      {consultation.lawyer?.specialization || "N/A"}
                    </LawyerSpecialty>
                  </div>
                </LawyerInfo>

                <ConsultationDetails>
                  <DetailItem>
                    <FaClock className="detail-icon" />
                    <span>
                      {formatDate(consultation.transaction?.createdAt)}
                    </span>
                  </DetailItem>

                  <DetailItem>
                    <FaMoneyBillWave className="detail-icon" />
                    <span>₹{consultation.transaction?.amount || "N/A"}</span>
                  </DetailItem>

                  <DetailItem>
                    {consultation.transaction?.status === "success" ? (
                      <SuccessStatus>
                        <FaCheckCircle className="status-icon" />
                        <span>Completed</span>
                      </SuccessStatus>
                    ) : (
                      <FailedStatus>
                        <FaTimesCircle className="status-icon" />
                        <span>Failed</span>
                      </FailedStatus>
                    )}
                  </DetailItem>
                </ConsultationDetails>

                <TransactionId>
                  Transaction ID: {consultation.transaction?.paymentId || "N/A"}
                </TransactionId>
              </ConsultationCard>
            ))}
          </ConsultationList>

          {totalPages > 1 && (
            <Pagination>
              <PaginationButton
                onClick={() => paginate(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </PaginationButton>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (number) => (
                  <PaginationButton
                    key={number}
                    onClick={() => paginate(number)}
                    active={number === currentPage}
                  >
                    {number}
                  </PaginationButton>
                )
              )}

              <PaginationButton
                onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </PaginationButton>
            </Pagination>
          )}

          <ResultsInfo>
            Showing {indexOfFirstItem + 1}-
            {Math.min(indexOfLastItem, filteredConsultations.length)} of{" "}
            {filteredConsultations.length} consultations
          </ResultsInfo>
        </>
      )}
    </PageContainer>
  );
};

// Styled Components
const PageContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 2rem;

  h1 {
    color: #2c3e50;
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
  }

  p {
    color: #7f8c8d;
    font-size: 1.1rem;
  }

  @media (max-width: 768px) {
    h1 {
      font-size: 2rem;
    }
  }
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 50px;
  height: 50px;
  border: 5px solid #f3f3f3;
  border-top: 5px solid #1c1c84;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 2rem auto;
  display: block;

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

const ErrorMessage = styled.div`
  background-color: #ffebee;
  color: #c62828;
  padding: 1rem;
  border-radius: 5px;
  text-align: center;
  margin: 2rem auto;
  max-width: 500px;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 1rem;
  background-color: #f8f9fa;
  border-radius: 10px;
  margin-top: 2rem;

  h3 {
    color: #2c3e50;
    margin-top: 1rem;
  }

  p {
    color: #7f8c8d;
  }
`;

const EmptyStateIcon = styled.div`
  width: 80px;
  height: 80px;
  background-color: #e0e0e0;
  border-radius: 50%;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  color: #9e9e9e;
`;

const ConsultationList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const ConsultationCard = styled.div`
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  padding: 1.5rem;
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  }

  @media (max-width: 480px) {
    padding: 1rem;
  }
`;

const LawyerInfo = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #eee;
`;

const LawyerAvatar = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: #e3f2fd;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
  color: #1c1c84;
  font-size: 1.5rem;
`;

const LawyerName = styled.h3`
  color: #2c3e50;
  margin-bottom: 0.25rem;
  font-size: 1.25rem;
`;

const LawyerSpecialty = styled.p`
  color: #7f8c8d;
  font-size: 0.9rem;
  margin-bottom: 0;
`;

const ConsultationDetails = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const DetailItem = styled.div`
  display: flex;
  align-items: center;
  font-size: 0.95rem;

  .detail-icon {
    margin-right: 0.5rem;
    color: #7f8c8d;
    font-size: 1.1rem;
  }

  @media (max-width: 480px) {
    font-size: 0.85rem;
  }
`;

const SuccessStatus = styled.span`
  color: #2e7d32;
  display: flex;
  align-items: center;

  .status-icon {
    margin-right: 0.5rem;
  }
`;

const FailedStatus = styled.span`
  color: #c62828;
  display: flex;
  align-items: center;

  .status-icon {
    margin-right: 0.5rem;
  }
`;

const TransactionId = styled.div`
  font-size: 0.8rem;
  color: #7f8c8d;
  background-color: #f5f5f5;
  padding: 0.5rem;
  border-radius: 4px;
  word-break: break-all;
  margin-top: 1rem;
`;

const SearchContainer = styled.div`
  position: relative;
  margin: 1.5rem 0;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.8rem 1rem 0.8rem 2.5rem;
  border: 1px solid #ddd;
  border-radius: 25px;
  font-size: 0.95rem;
  transition: all 0.3s;

  &:focus {
    outline: none;
    border-color: #1c1c84;
    box-shadow: 0 0 0 2px rgba(30, 77, 122, 0.2);
  }
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #7f8c8d;
`;

const Pagination = styled.div`
  display: flex;
  justify-content: center;
  margin: 2rem 0;
  flex-wrap: wrap;
`;

const PaginationButton = styled.button`
  margin: 0 0.25rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid #ddd;
  background-color: ${(props) => (props.active ? "#1c1c84" : "white")};
  color: ${(props) => (props.active ? "white" : "#2c3e50")};
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background-color: ${(props) => (props.active ? "#1c1c84" : "#f5f5f5")};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  @media (max-width: 480px) {
    padding: 0.4rem 0.6rem;
    margin: 0.1rem;
  }
`;

const ResultsInfo = styled.div`
  text-align: center;
  color: #7f8c8d;
  font-size: 0.9rem;
  margin-bottom: 1rem;
`;

export default ClientHistoryPage;
