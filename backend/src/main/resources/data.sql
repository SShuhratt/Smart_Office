-- Insert test employees
INSERT INTO employees (full_name, email, department, position) VALUES
('John Doe', 'john.doe@bank.com', 'IT', 'Developer'),
('Jane Smith', 'jane.smith@bank.com', 'HR', 'Manager'),
('Bob Johnson', 'bob.johnson@bank.com', 'Finance', 'Analyst');

-- Insert test assets
INSERT INTO assets (name, category, serial_number, status, location) VALUES
('Dell Laptop', 'Laptop', 'SN001', 'REGISTERED', 'Office 101'),
('HP Printer', 'Printer', 'SN002', 'ASSIGNED', 'Office 102'),
('iPhone 12', 'Mobile', 'SN003', 'IN_REPAIR', 'IT Department'),
('MacBook Pro', 'Laptop', 'SN004', 'REGISTERED', 'Office 103'),
('Projector', 'Equipment', 'SN005', 'LOST', 'Conference Room');