import React, { useState } from 'react';
import { Form, Button, Row, Col, Card } from 'react-bootstrap';

const DateSelector = ({ onDateSelect }) => {
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Formatear la fecha seleccionada
  const formattedDate = selectedDate.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Obtener el primer día del mes y el número de días
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const lastDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  
  // Obtener el día de la semana del primer día (0 = domingo, 1 = lunes, etc.)
  const firstDayWeekday = firstDayOfMonth.getDay();
  
  // Ajustar para que la semana comience en lunes (0 = lunes, 6 = domingo)
  const adjustedFirstDay = firstDayWeekday === 0 ? 6 : firstDayWeekday - 1;
  
  // Crear array de días para el calendario
  const calendarDays = [];
  
  // Añadir días vacíos al principio
  for (let i = 0; i < adjustedFirstDay; i++) {
    calendarDays.push(null);
  }
  
  // Añadir los días del mes
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }
  
  // Manejar cambio de mes
  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };
  
  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };
  
  // Manejar selección de día
  const handleDayClick = (day) => {
    if (day) {
      const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      setSelectedDate(newDate);
      if (onDateSelect) {
        onDateSelect(newDate);
      }
      setShowCalendar(false);
    }
  };
  
  // Verificar si un día es el seleccionado
  const isSelectedDay = (day) => {
    if (!day) return false;
    return selectedDate.getDate() === day && 
           selectedDate.getMonth() === currentMonth.getMonth() && 
           selectedDate.getFullYear() === currentMonth.getFullYear();
  };
  
  // Nombres de los meses y días de la semana en español
  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const weekdayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  return (
    <div className="date-selector">
      <div className="d-flex align-items-center">
  <Form.Label className="fw-medium mb-0 me-2">Fecha seleccionada:</Form.Label>
  <div className="selected-date text-capitalize me-3">
    {formattedDate}
  </div>
  <Button 
    variant="outline-primary" 
    size="sm"
    onClick={() => setShowCalendar(!showCalendar)}
  >
    <i className="bi bi-calendar3"></i> {showCalendar ? 'Ocultar' : 'Cambiar'}
  </Button>
</div>

  
       {showCalendar && (
  <Row className="mt-3">
    <Col md={8} lg={9}>
      <Card className="calendar-container">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <Button variant="light" size="sm" onClick={handlePrevMonth}>
            <i className="bi bi-chevron-left"></i>
          </Button>
          <div className="fw-bold">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </div>
          <Button variant="light" size="sm" onClick={handleNextMonth}>
            <i className="bi bi-chevron-right"></i>
          </Button>
        </Card.Header>
        <Card.Body className="p-3">
          <div className="d-grid" style={{ gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
            {/* Días de la semana */}
            {weekdayNames.map((day, index) => (
              <div key={`weekday-${index}`} className="text-center p-2 fw-bold">
                {day}
              </div>
            ))}
            
            {/* Días del mes */}
            {calendarDays.map((day, index) => (
              <div 
                key={`day-${index}`} 
                className={`text-center p-2 ${day ? 'cursor-pointer' : ''} ${
                  isSelectedDay(day) ? 'bg-primary text-white rounded' : ''
                }`}
                onClick={() => handleDayClick(day)}
                style={{ cursor: day ? 'pointer' : 'default' }}
              >
                {day}
              </div>
            ))}
          </div>
        </Card.Body>
      </Card>
    </Col>
  </Row>
)}

      
    </div>
  );
};

export default DateSelector;