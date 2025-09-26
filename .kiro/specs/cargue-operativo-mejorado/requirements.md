# Requirements Document

## Introduction

The cargue operativo (operational loading) system is a critical component of the CRM factory application that manages daily product loading operations for different vendors. Based on the existing implementation, this feature handles product inventory management, vendor assignments, batch tracking, and operational workflow coordination. The system currently supports multiple vendor IDs (ID1-ID6), manages product quantities, handles expired lots, and provides comprehensive reporting capabilities.

This specification aims to enhance the existing cargue system by improving data consistency, user experience, error handling, and adding new functionality for better operational control.

## Requirements

### Requirement 1

**User Story:** As a factory operator, I want to reliably save operational loading data without encountering database constraint errors, so that I can complete my daily loading tasks efficiently.

#### Acceptance Criteria

1. WHEN I press the "FINALIZAR" button THEN the system SHALL save all product data to the database without null constraint violations
2. WHEN data is being saved THEN the system SHALL validate all required fields before sending to the backend
3. IF any required field is missing THEN the system SHALL display a clear error message indicating which field needs attention
4. WHEN the save operation completes successfully THEN the system SHALL display a confirmation message with the saved record ID

### Requirement 2

**User Story:** As a factory operator, I want the responsible person names to be stored in the database and display correctly without visual glitches, so that I can maintain permanent records of who handled each vendor's loading operation.

#### Acceptance Criteria

1. WHEN the page loads THEN the system SHALL display the correct responsible person name from the database immediately without showing placeholder text first
2. WHEN I change a responsible person name THEN the system SHALL save it to the database and update all related displays instantly without page refresh
3. WHEN I reload the page THEN the system SHALL retrieve and display the responsible person names from the database
4. WHEN I save a cargue operation THEN the system SHALL include the responsible person name in the database record for audit purposes
5. IF no responsible person is set THEN the system SHALL display a default placeholder and require the field to be filled before allowing save operations

### Requirement 3

**User Story:** As a factory operator, I want to track and manage expired product lots effectively, so that I can ensure product quality and compliance.

#### Acceptance Criteria

1. WHEN I enter expired quantities for a product THEN the system SHALL require me to specify which lots are expired
2. WHEN I save data with expired products THEN the system SHALL validate that expired lots are properly documented
3. WHEN viewing expired lots THEN the system SHALL display lot numbers, expiration dates, and quantities clearly
4. IF I try to save expired quantities without specifying lots THEN the system SHALL prevent the save and show a validation error

### Requirement 4

**User Story:** As a factory supervisor, I want to monitor the status of loading operations across all vendors, so that I can ensure operational efficiency and identify bottlenecks.

#### Acceptance Criteria

1. WHEN viewing the cargue dashboard THEN the system SHALL display the current status of each vendor's loading operation
2. WHEN a loading operation changes status THEN the system SHALL update the display in real-time
3. WHEN I filter by date or vendor THEN the system SHALL show only relevant loading records
4. WHEN I export loading data THEN the system SHALL generate a comprehensive report including all product details and status information

### Requirement 5

**User Story:** As a factory operator, I want to handle product returns and adjustments accurately, so that inventory levels remain correct.

#### Acceptance Criteria

1. WHEN I enter return quantities THEN the system SHALL add these back to available inventory
2. WHEN I enter expired quantities THEN the system SHALL record them for tracking but not add back to available inventory
3. WHEN I make quantity adjustments THEN the system SHALL log the changes with timestamp and user information
4. WHEN calculating final quantities THEN the system SHALL properly account for additions, subtractions, returns, and expired items

### Requirement 6

**User Story:** As a system administrator, I want comprehensive error logging and recovery mechanisms, so that I can quickly diagnose and resolve operational issues.

#### Acceptance Criteria

1. WHEN any API error occurs THEN the system SHALL log detailed error information including request data and response
2. WHEN the system encounters a network failure THEN the system SHALL provide offline capability to continue working
3. WHEN data synchronization fails THEN the system SHALL queue the data for retry and notify the user
4. WHEN I access error logs THEN the system SHALL provide filtering and search capabilities to find specific issues

### Requirement 7

**User Story:** As a factory operator, I want to validate data integrity before finalizing operations, so that I can prevent errors and ensure accurate records.

#### Acceptance Criteria

1. WHEN I attempt to finalize a loading operation THEN the system SHALL validate all product quantities are within acceptable ranges
2. WHEN validation fails THEN the system SHALL highlight problematic fields and provide specific guidance for correction
3. WHEN all validations pass THEN the system SHALL allow the finalization to proceed
4. IF critical data is missing THEN the system SHALL prevent finalization and require completion of mandatory fields
5. WHEN finalizing THEN the system SHALL validate that a responsible person name is assigned and saved in the database

### Requirement 8

**User Story:** As a database administrator, I want the responsible person field to be properly stored in each vendor's cargue table, so that we have permanent audit trails and can track accountability.

#### Acceptance Criteria

1. WHEN the system creates cargue tables for vendors (ID1-ID6) THEN each table SHALL include a `responsable` field to store the responsible person's name
2. WHEN a responsible person name is updated THEN the system SHALL save it to the corresponding vendor's database table
3. WHEN querying historical cargue data THEN the system SHALL return the responsible person information along with other cargue details
4. WHEN migrating from localStorage-only storage THEN the system SHALL preserve existing responsible person assignments by transferring them to the database
5. IF a cargue record exists without a responsible person THEN the system SHALL allow updating the field retroactively

### Requirement 9

**User Story:** As a factory operator, I want seamless synchronization between the database and user interface for responsible person names, so that changes are immediately reflected and persistent across sessions.

#### Acceptance Criteria

1. WHEN I change a responsible person name in the UI THEN the system SHALL immediately update the database and localStorage for backup
2. WHEN the page loads THEN the system SHALL prioritize database values over localStorage for responsible person names
3. WHEN the database is unavailable THEN the system SHALL fall back to localStorage values and sync when connection is restored
4. WHEN multiple users are working simultaneously THEN the system SHALL handle concurrent updates to responsible person names without conflicts
5. WHEN I edit a responsible person name THEN the system SHALL validate the name format and length before saving