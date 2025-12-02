import React from "react";
import { Button } from "react-bootstrap";

export default function TabsActions({ selectedTab, setSelectedTab }) {
  const tabs = [
    { id: "Ventas", label: "Ventas", icon: "point_of_sale" },
    { id: "Reportes", label: "Reportes", icon: "assessment" }
  ];

  return (
    <div className="d-flex align-items-center gap-2 mb-3 flex-wrap">
      {tabs.map((tab) => (
        <Button
          key={tab.id}
          variant={selectedTab === tab.id ? "primary" : "outline-secondary"}
          size="sm"
          onClick={() => setSelectedTab(tab.id)}
          className="d-flex align-items-center"
        >
          <span className="material-icons me-1" style={{ fontSize: '16px' }}>
            {tab.icon}
          </span>
          {tab.label}
        </Button>
      ))}
    </div>
  );
}