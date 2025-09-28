# Design Document

## Overview

The enhanced operational loading (cargue operativo) system is designed to improve the reliability, data consistency, and user experience of the existing cargue functionality in the CRM factory application. The system manages daily product loading operations across 6 vendor IDs (ID1-ID6), handles product quantities, expired lots tracking, and provides comprehensive operational workflow coordination.

This design addresses the critical issues identified in the requirements: database constraint violations, responsible person name management, expired lot tracking, operational status monitoring, inventory accuracy, error handling, data validation, and seamless synchronization between database and user interface.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend React Layer                         │
├─────────────────────────────────────────────────────────────────┤
│  PlantillaOperativa.jsx  │  ResponsableManager.jsx  │  Utils   │
│  TablaProductos.jsx      │  VerificarGuardado.jsx   │          │
│  ResumenVentas.jsx       │  ControlCumplimiento.jsx │          │
└─────────────────────────────────────────────────────────────────┘
                                    │
                            HTTP/REST API
                                    │
┌─────────────────────────────────────────────────────────────────┐
│                    Backend Django Layer                         │
├─────────────────────────────────────────────────────────────────┤
│  CargueID1-ID6ViewSets   │  VendedorViewSet         │  Utils   │
│  Serializers             │  Error Handlers          │          │
│  Validation Logic        │  Sync Services           │          │
└─────────────────────────────────────────────────────────────────┘
                                    │
                            Database Layer
                                    │
┌─────────────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                          │
├─────────────────────────────────────────────────────────────────┤
│  api_cargueid1-id6       │  api_producto            │  Indexes │
│  Responsible Person      │  Inventory Tables        │          │
│  Audit Trails           │  Error Logs              │          │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   localStorage  │◄──►│   Frontend UI   │◄──►│   Database      │
│   (Backup)      │    │   (Primary)     │    │   (Source of    │
│                 │    │                 │    │    Truth)       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Components and Interfaces

### 1. Enhanced Data Validation Layer

#### Frontend Validation Component
```javascript
// ValidationService.js
class CargueValidationService {
  validateRequiredFields(cargueData) {
    const requiredFields = ['dia', 'fecha', 'responsable'];
    const errors = [];
    
    requiredFields.forEach(field => {
      if (!cargueData[field] || cargueData[field] === 'RESPONSABLE') {
        errors.push(`${field} is required`);
      }
    });
    
    return { isValid: errors.length === 0, errors };
  }
  
  validateProductData(productos) {
    const errors = [];
    
    productos.forEach((producto, index) => {
      if (producto.cantidad > 0) {
        if (!producto.v || !producto.d) {
          errors.push(`Product ${index + 1}: Both V and D checkboxes must be marked`);
        }
      }
      
      if (producto.vencidas > 0 && !producto.lotes_vencidos) {
        errors.push(`Product ${index + 1}: Expired lots must be specified`);
      }
    });
    
    return { isValid: errors.length === 0, errors };
  }
}
```

#### Backend Validation Layer
```python
# validators.py
class CargueValidator:
    @staticmethod
    def validate_cargue_data(data):
        errors = []
        
        # Required field validation
        required_fields = ['dia', 'fecha', 'responsable']
        for field in required_fields:
            if not data.get(field) or data.get(field) == 'RESPONSABLE':
                errors.append(f'{field} is required')
        
        # Product validation
        if data.get('vencidas', 0) > 0 and not data.get('lotes_vencidos'):
            errors.append('Expired lots must be specified when expired quantity > 0')
        
        # Quantity validation
        cantidad = data.get('cantidad', 0)
        if cantidad < 0:
            errors.append('Quantity cannot be negative')
        
        return errors
```

### 2. Responsible Person Management System

#### ResponsableManager Component
```javascript
// ResponsableManager.jsx
class ResponsableManager {
  constructor(idSheet) {
    this.idSheet = idSheet;
    this.initializeResponsable();
  }
  
  async initializeResponsable() {
    // Priority order: Database -> localStorage -> default
    try {
      const dbResponsable = await this.loadFromDatabase();
      if (dbResponsable && dbResponsable !== 'RESPONSABLE') {
        this.setResponsable(dbResponsable);
        return;
      }
      
      const localResponsable = responsableStorage.get(this.idSheet);
      if (localResponsable) {
        this.setResponsable(localResponsable);
        await this.syncToDatabase(localResponsable);
      }
    } catch (error) {
      console.error('Error initializing responsable:', error);
    }
  }
  
  async updateResponsable(newName) {
    // Immediate UI update
    this.setResponsable(newName);
    
    // Dual persistence
    responsableStorage.set(this.idSheet, newName);
    await this.syncToDatabase(newName);
    
    // Event notification
    this.notifyUpdate(newName);
  }
}
```

#### Database Synchronization Service
```python
# sync_service.py
class ResponsableSyncService:
    @staticmethod
    def update_responsable(id_vendedor, responsable_name):
        modelo_map = {
            'ID1': CargueID1, 'ID2': CargueID2, 'ID3': CargueID3,
            'ID4': CargueID4, 'ID5': CargueID5, 'ID6': CargueID6
        }
        
        modelo = modelo_map.get(id_vendedor)
        if not modelo:
            raise ValueError(f'Invalid vendor ID: {id_vendedor}')
        
        # Update all active records for this vendor
        updated_count = modelo.objects.filter(activo=True).update(
            responsable=responsable_name
        )
        
        return updated_count
```

### 3. Expired Lots Tracking System

#### LotesVencidos Component
```javascript
// LotesVencidos.jsx
class LotesVencidosManager {
  constructor() {
    this.lotes = [];
  }
  
  addExpiredLot(lote, motivo, cantidad) {
    const expiredLot = {
      lote: lote,
      motivo: motivo, // 'HONGO', 'FVTO', 'SELLADO'
      cantidad: cantidad,
      fecha: new Date().toISOString()
    };
    
    this.lotes.push(expiredLot);
    return this.serialize();
  }
  
  serialize() {
    return JSON.stringify(this.lotes);
  }
  
  deserialize(jsonString) {
    try {
      this.lotes = JSON.parse(jsonString || '[]');
    } catch (error) {
      console.error('Error parsing expired lots:', error);
      this.lotes = [];
    }
  }
}
```

### 4. Error Handling and Recovery System

#### Frontend Error Handler
```javascript
// ErrorHandler.js
class CargueErrorHandler {
  constructor() {
    this.errorQueue = [];
    this.retryAttempts = 3;
  }
  
  async handleApiError(error, operation, data) {
    const errorInfo = {
      timestamp: new Date().toISOString(),
      operation: operation,
      error: error.message,
      data: data,
      retryCount: 0
    };
    
    // Log error
    console.error('Cargue API Error:', errorInfo);
    
    // Queue for retry if network error
    if (this.isNetworkError(error)) {
      this.queueForRetry(errorInfo);
      return { success: false, queued: true };
    }
    
    // Show user-friendly error
    this.showUserError(error);
    return { success: false, queued: false };
  }
  
  async retryQueuedOperations() {
    const retryPromises = this.errorQueue.map(async (errorInfo) => {
      if (errorInfo.retryCount < this.retryAttempts) {
        try {
          await this.retryOperation(errorInfo);
          this.removeFromQueue(errorInfo);
        } catch (error) {
          errorInfo.retryCount++;
        }
      }
    });
    
    await Promise.allSettled(retryPromises);
  }
}
```

#### Backend Error Logging
```python
# error_logger.py
class CargueErrorLogger:
    @staticmethod
    def log_error(operation, error, request_data=None, user=None):
        error_record = {
            'timestamp': timezone.now(),
            'operation': operation,
            'error_message': str(error),
            'error_type': type(error).__name__,
            'request_data': request_data,
            'user': user,
            'stack_trace': traceback.format_exc()
        }
        
        # Log to database
        ErrorLog.objects.create(**error_record)
        
        # Log to file for debugging
        logger.error(f"Cargue Error: {operation}", extra=error_record)
        
        return error_record
```

### 5. Real-time Status Monitoring

#### Status Dashboard Component
```javascript
// StatusDashboard.jsx
class CargueStatusDashboard {
  constructor() {
    this.vendorStatuses = {};
    this.initializeWebSocket();
  }
  
  initializeWebSocket() {
    // Real-time updates for vendor statuses
    this.ws = new WebSocket('ws://localhost:8000/ws/cargue-status/');
    
    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.updateVendorStatus(data.vendorId, data.status);
    };
  }
  
  updateVendorStatus(vendorId, status) {
    this.vendorStatuses[vendorId] = {
      ...this.vendorStatuses[vendorId],
      status: status,
      lastUpdate: new Date()
    };
    
    this.renderStatusUpdate(vendorId);
  }
}
```

## Data Models

### Enhanced CargueID Models

The existing CargueID1-ID6 models are already well-structured. The enhancements focus on:

1. **Validation at Model Level**
```python
class CargueID1(models.Model):
    # ... existing fields ...
    
    def clean(self):
        errors = {}
        
        # Validate responsable field
        if not self.responsable or self.responsable == 'RESPONSABLE':
            errors['responsable'] = 'Responsible person must be specified'
        
        # Validate expired lots
        if self.vencidas > 0 and not self.lotes_vencidos:
            errors['lotes_vencidos'] = 'Expired lots must be specified'
        
        if errors:
            raise ValidationError(errors)
    
    def save(self, *args, **kwargs):
        self.full_clean()
        # ... existing save logic ...
        super().save(*args, **kwargs)
```

2. **Audit Trail Enhancement**
```python
class CargueAuditLog(models.Model):
    cargue_id = models.IntegerField()
    cargue_type = models.CharField(max_length=10)  # ID1, ID2, etc.
    action = models.CharField(max_length=50)
    old_values = models.JSONField(null=True, blank=True)
    new_values = models.JSONField(null=True, blank=True)
    user = models.CharField(max_length=100)
    timestamp = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
```

### Error Logging Model
```python
class CargueErrorLog(models.Model):
    timestamp = models.DateTimeField(auto_now_add=True)
    operation = models.CharField(max_length=100)
    error_message = models.TextField()
    error_type = models.CharField(max_length=100)
    request_data = models.JSONField(null=True, blank=True)
    user = models.CharField(max_length=100, null=True, blank=True)
    stack_trace = models.TextField(null=True, blank=True)
    resolved = models.BooleanField(default=False)
    resolution_notes = models.TextField(null=True, blank=True)
```

## Error Handling

### 1. Frontend Error Handling Strategy

#### Validation Errors
- **Pre-submission validation**: Validate all required fields before allowing save
- **Real-time feedback**: Show validation errors as user types
- **Field highlighting**: Visually indicate problematic fields
- **Guided correction**: Provide specific instructions for fixing errors

#### Network Errors
- **Offline capability**: Allow continued work when network is unavailable
- **Automatic retry**: Queue failed operations for automatic retry
- **User notification**: Inform users of network issues and retry status
- **Data preservation**: Ensure no data loss during network failures

#### Server Errors
- **Graceful degradation**: Continue operation with reduced functionality
- **Error reporting**: Automatically report server errors for investigation
- **User-friendly messages**: Translate technical errors to user-friendly language
- **Recovery suggestions**: Provide actionable steps for error resolution

### 2. Backend Error Handling Strategy

#### Database Constraint Violations
```python
def handle_constraint_violation(self, error, data):
    if 'null value in column' in str(error):
        missing_field = self.extract_missing_field(error)
        return Response({
            'error': f'Required field missing: {missing_field}',
            'field': missing_field,
            'code': 'MISSING_REQUIRED_FIELD'
        }, status=400)
    
    return Response({
        'error': 'Database constraint violation',
        'details': str(error),
        'code': 'CONSTRAINT_VIOLATION'
    }, status=400)
```

#### Data Validation Errors
```python
def validate_cargue_data(self, data):
    validator = CargueValidator()
    errors = validator.validate_cargue_data(data)
    
    if errors:
        return Response({
            'error': 'Validation failed',
            'validation_errors': errors,
            'code': 'VALIDATION_ERROR'
        }, status=400)
    
    return None  # No errors
```

## Testing Strategy

### 1. Unit Testing

#### Frontend Component Tests
```javascript
// ResponsableManager.test.js
describe('ResponsableManager', () => {
  test('should initialize with database value', async () => {
    const manager = new ResponsableManager('ID1');
    await manager.initializeResponsable();
    expect(manager.getResponsable()).toBe('EXPECTED_NAME');
  });
  
  test('should fallback to localStorage when database fails', async () => {
    // Mock database failure
    // Test localStorage fallback
  });
  
  test('should sync to database on update', async () => {
    const manager = new ResponsableManager('ID1');
    await manager.updateResponsable('NEW_NAME');
    // Verify database update
  });
});
```

#### Backend API Tests
```python
# test_cargue_api.py
class CargueAPITestCase(TestCase):
    def test_create_cargue_with_valid_data(self):
        data = {
            'dia': 'LUNES',
            'fecha': '2025-01-20',
            'responsable': 'TEST_USER',
            'producto': 'AREPA TEST',
            'cantidad': 10
        }
        response = self.client.post('/api/cargue-id1/', data)
        self.assertEqual(response.status_code, 201)
    
    def test_create_cargue_missing_responsable(self):
        data = {
            'dia': 'LUNES',
            'fecha': '2025-01-20',
            'producto': 'AREPA TEST',
            'cantidad': 10
        }
        response = self.client.post('/api/cargue-id1/', data)
        self.assertEqual(response.status_code, 400)
        self.assertIn('responsable', response.json()['validation_errors'])
```

### 2. Integration Testing

#### End-to-End Workflow Tests
```javascript
// e2e/cargue-workflow.test.js
describe('Cargue Complete Workflow', () => {
  test('should complete full cargue process', async () => {
    // 1. Load page and verify responsable loads
    // 2. Add products and quantities
    // 3. Mark V and D checkboxes
    // 4. Add expired lots if needed
    // 5. Complete finalization
    // 6. Verify database persistence
    // 7. Verify inventory updates
  });
});
```

### 3. Performance Testing

#### Load Testing
- Test concurrent users updating responsable names
- Test large product lists performance
- Test database query optimization
- Test real-time status updates under load

#### Stress Testing
- Test system behavior with network failures
- Test recovery from database connection loss
- Test memory usage with large datasets
- Test error handling under extreme conditions

### 4. User Acceptance Testing

#### Validation Scenarios
- Test all validation error messages are clear
- Test user can recover from all error states
- Test offline functionality works as expected
- Test data persistence across browser sessions

#### Usability Testing
- Test responsable name management is intuitive
- Test expired lots tracking is easy to use
- Test error messages guide users to solutions
- Test overall workflow efficiency improvements

This comprehensive design addresses all the requirements while maintaining compatibility with the existing system architecture and ensuring robust error handling, data validation, and user experience improvements.