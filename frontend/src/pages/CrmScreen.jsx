import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Row, Col, Card, Nav } from "react-bootstrap";
import CustomerList from "../components/Crm/CustomerList";
import CustomerForm from "../components/Crm/CustomerForm";
import CustomerDetails from "../components/Crm/CustomerDetails";
import "../styles/CrmScreen.css";

export default function CrmScreen() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("customers");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [viewMode, setViewMode] = useState("list"); // list, details, form

  // Handle customer selection
  const handleSelectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setViewMode("details");
  };

  // Handle new customer button
  const handleNewCustomer = () => {
    setSelectedCustomer(null);
    setViewMode("form");
  };

  // Handle back to list
  const handleBackToList = () => {
    setViewMode("list");
  };

  return (
    <div className="crm-screen">
      <div className="header">
        <button onClick={() => navigate(-1)} className="back-button">
          Volver al Menú
        </button>
        <h2>Gestión de Clientes</h2>
      </div>

      <Container fluid>
        <Row>
          <Col md={3} lg={2} className="sidebar-col">
            <Card className="sidebar-card">
              <Nav className="flex-column">
                <Nav.Link 
                  className={activeTab === "customers" ? "active" : ""} 
                  onClick={() => setActiveTab("customers")}
                >
                  <i className="bi bi-people"></i> Clientes
                </Nav.Link>
                <Nav.Link 
                  className={activeTab === "sales" ? "active" : ""} 
                  onClick={() => setActiveTab("sales")}
                >
                  <i className="bi bi-graph-up"></i> Ventas
                </Nav.Link>
                <Nav.Link 
                  className={activeTab === "reports" ? "active" : ""} 
                  onClick={() => setActiveTab("reports")}
                >
                  <i className="bi bi-file-earmark-text"></i> Informes
                </Nav.Link>
                <Nav.Link 
                  className={activeTab === "settings" ? "active" : ""} 
                  onClick={() => setActiveTab("settings")}
                >
                  <i className="bi bi-gear"></i> Configuración
                </Nav.Link>
              </Nav>
            </Card>
          </Col>

          <Col md={9} lg={10}>
            <Card className="content-card">
              {activeTab === "customers" && (
                <div className="customers-section">
                  {viewMode === "list" && (
                    <CustomerList 
                      onSelectCustomer={handleSelectCustomer} 
                      onNewCustomer={handleNewCustomer}
                    />
                  )}
                  {viewMode === "details" && selectedCustomer && (
                    <CustomerDetails 
                      customer={selectedCustomer} 
                      onBack={handleBackToList}
                      onEdit={() => setViewMode("form")}
                    />
                  )}
                  {viewMode === "form" && (
                    <CustomerForm 
                      customer={selectedCustomer} 
                      onBack={handleBackToList}
                      onSave={(savedCustomer) => {
                        setSelectedCustomer(savedCustomer);
                        setViewMode("details");
                      }}
                    />
                  )}
                </div>
              )}
              {activeTab === "sales" && (
                <div className="sales-section">
                  <h3>Historial de Ventas</h3>
                  <p>Esta sección está en desarrollo.</p>
                </div>
              )}
              {activeTab === "reports" && (
                <div className="reports-section">
                  <h3>Informes de Clientes</h3>
                  <p>Esta sección está en desarrollo.</p>
                </div>
              )}
              {activeTab === "settings" && (
                <div className="settings-section">
                  <h3>Configuración de CRM</h3>
                  <p>Esta sección está en desarrollo.</p>
                </div>
              )}
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}