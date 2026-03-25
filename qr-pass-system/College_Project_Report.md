C.K.Pithawalla College of Commerce-Management-Computer Application, Surat
VEER NARMAD SOUTH GUJARAT UNIVERSITY, SURAT
PROJECT REPORT
ON
BharatPass (QR-Based Bus/Train Pass Management System)
AS A PARTIAL REQUIREMENT FOR THE DEGREE
OF
BACHELOR OF COMPUTER APPLICATION
(B.C.A 6th SEMSTER )
2025-2026






Acknowledgement
The reason of completing the project work successfully is not just our efforts but efforts of many people. The people, who trusted, guided and encouraged us with every means. Guide is a person who provides you the direction towards success, so we feel great pleasure to express our gratitude to all our guides, our faculty members as well as every person who helped me directly or indirectly with our project.

We would like to thank Dr. Chetan Patel (Principal at C.K.Pithawalla College) and Mr. Gaurang Joshi (BCA-HOD at C.K.Pithawalla College) for granting us an opportunity to work on this project. Their skills and experience was a guiding path in this learning process. She/He made constant efforts to shape up our skills as per the industry Standards. They provided us a very homely and friendly environment which made it the best place to work. Their guidance was really priceless and will always be a guiding light in Industry. 

We are also indebted to our Faculty Mr/Ms.xxxxxx(Guide Name) who provided constant encouragement, support & valuable guidance before and during our project. It was his/her effort who led us to this place for project work. His/Her guidance and suggestions were invaluable.
Thank you very much

                                                                                              
 
Index
SrNo	Chapter	Page No
1	Introduction	1
	1.1	Project Profile	2
	1.2	Project Introduction	3
2	Environment Description	4
	2.1	Hardware Software Requirement	5
	2.2	Tools & Technology	6
3	Proposed System	13
	3.1	Scope	14
4	System Model Architecture	29
	4.1	Use Case Diagram	30
5	System Diagram 	67
	5.1	Table Structure	75
	5.2	Screen Layout	76
6	References	208
 
1
Chapter
________________________________________
Introduction
1.1	Project Profile
1.2	Project Introduction
 
	

	
Project Title		:	BharatPass
Objective	:	To provide a digital transit pass management system replacing paper-based passes with secure QR codes.
Name of the Institute	:	C.K.Pithawalla College of Commerce-Management - Computer Application
Project Guide	:	Mr/Ms.xxxxxx
Front End	:	HTML, CSS, JavaScript
Back End	:	Node.js, Express.js (Local), Netlify Serverless Functions (Production)
Database	:	MongoDB / LocalStorage
Team Members	:	3



 



•	BharatPass is a digital transit pass management system that replaces paper-based bus/train passes.
•	BharatPass users (passengers) can securely log in, apply for a pass, and generate a unique QR code for travel.
•	BharatPass admins can monitor statistics, manage users, approve/reject passes, and view total revenue.
•	BharatPass conductors can use their device cameras to scan passenger QR codes for real-time validation.
•	BharatPass ensures secure role-based access control, directing each user to their specific dashboard.
•	BharatPass integrates a simulated payment flow for smooth pass activation and transaction tracking.
•	BharatPass offers a modern, responsive Glassmorphism design with dark/light mode functionality.
•	BharatPass maintains persistent data using simulated in-browser database (localStorage) or MongoDB.
•	BharatPass empowers transit authorities to seamlessly track scans, invalid passes, and passenger history.





 
2
Chapter
________________________________________
Environment Description
2.1   	Hardware and Software Requirement
	2.1.1	Development Tools
	2.1.2	Client Side Tools
	2.1.3	Server Side Tools
2.2    	Tools and Technology
	2.2.1	Core Technology
	2.2.2	Extra Tools
 
 



	Client Side :
		- Internet enabled devices with Web Browser 
	Server Side :
		- Node.js Environment 
		- Disk Space (1 GB Minimum)
	Development Side :
		 -  Processor (Intel Inside Pentium or higher)
		  - O.S (Windows 8.1 / 10 / 11)
		  - Memory (2 GB minimum, 8GB recommended)
		  - Hard Disk (500 GB)
		 - Web Browser: Developed in Google Chrome (Tested in Mozilla Firefox)


 



Technology:
	Core Technology :
 		- HTML5, CSS3, JavaScript (ES6+), Node.js
	Extra Technology:
 		- Express, qrcode (npm), Netlify Serverless
Tools:
	Documentation Tools:
 		- MS Word, Markdown

	Development Tools:
		- Visual Studio Code






	
	 

3
Chapter
________________________________________
	3.1 Scope

	
Proposed System

 



	The scope of the website “BharatPass” is global and can be adopted by any city’s transit system.























 
Admin:
The admin oversees the entire BharatPass platform, managing users, passes, and conductors.
They ensure the system operations are smooth and transparent.
1.	Admin monitors platform activities through a comprehensive dashboard with statistics.
This helps maintain an overview of users, active passes, and revenue.
2.	Admin manages all registered users, viewing their roles and registration dates.
This ensures only authorized individuals can access conductor or admin privileges.
3.	Admin handles pass management by approving or rejecting pending passes.
They act as the final authority to validate a passenger's payment and issue their QR token.
4.	Admin reviews revenue reports categorized by pass types (Monthly, Quarterly, Yearly).
These reports help in tracking the financial performance of the transit system.
5.	Admin has access to the complete scan logs from all conductors.
This helps track exactly where and when passes are being used or flagged as invalid.
________________________________________
Conductor:
Conductors act as the on-ground validation authority for the BharatPass system.
Their main duty is to ensure passengers are traveling with valid digital passes.
1.	Conductors log into their specific scanner dashboard using their credentials.
This ensures that only authorized staff can scan and validate QR codes.
2.	Conductors use their device's built-in camera to scan passenger QR codes dynamically.
This allows for fast, real-time ticket checking without extra hardware.
3.	Conductors receive instant validation results indicating if a pass is valid, expired, or rejected.
This prevents fraudulent travel and verifies route applicability.
4.	Conductors generate a continuous scan history log during their session.
This provides a record of checked passengers for administrative auditing.
________________________________________
User (Passenger):
1.	Users register/login to create an account and access their personalized dashboard.
The dashboard keeps track of all past, present, and pending transit passes.
2.	Users apply for new passes by selecting their desired route and pass duration.
This makes purchasing public transport tickets convenient and queue-free.
3.	Users complete a simulated payment flow to activate their selected pass.
This ensures transparent and safe digital transactions.
4.	Users generate and download a unique QR code for each approved pass.
They use this digital QR token as their travel ticket when boarding the bus/train.
5.	Users can view their pass status (Pending, Active, Expired) at any time.
This gives them a clear understanding of when they need to renew.





 


Admin (Sub-Branch – 5 Points)
1.	Admin monitors platform activities through a dashboard tracking total users, passes, and revenue.
2.	Admin manages all users, viewing their respective roles and signup details.
3.	Admin handles pass management by approving (generating QR tokens) or rejecting pending passes.
4.	Admin tracks financial growth through detailed revenue reports based on pass types.
5.	Admin accesses system-wide scan logs to review conductor validation history.
________________________________________
Conductor (Sub-Branch – 4 Points)
1.	Conductors access a specialized, secure QR scanner dashboard upon logging in.
2.	Conductors use the built-in webcam/mobile camera to quickly scan passenger QR tokens.
3.	Conductors instantly see verification outcomes: valid, expired, or invalid route.
4.	Conductors continuously push scan records to the central database for administrative review.
________________________________________
User / Passenger (Sub-Branch – 5 Points)
1.	Users access a personal dashboard to view active, pending, and expired transit passes.
2.	Users apply for transit passes by specifying route preferences and selecting durations.
3.	Users process payments securely to finalize the purchase of their digital pass.
4.	Users retrieve and download unique QR codes to present to conductors during travel.
5.	Users track their transit pass expiration dates to manage timely renewals.
 

4
Chapter
________________________________________

System Model Architecture
4.1    	Use Case Diagram
	









 

	

	Admin’s Use Case Diagram:
(Details: Login -> View Dashboard -> Manage Users -> Approve/Reject Passes -> View Scan Logs)

	Conductor’s Use Case Diagram:
(Details: Login -> Open Camera Scanner -> Scan QR Code -> View Validation Status -> Logout)

	Passenger’s Use Case Diagram:
(Details: Login -> View Passes -> Apply for Pass -> Make Payment -> Download QR Code)



 
	


 5
Chapter
________________________________________

System Diagram


5.1   	Table Structure
5.2   	Screen Layout


 



Table Name: USERS
Use: It is used to store the information of all Users (Passengers, Admins, Conductors).
Field	Type	Constraints	Description
id	string	Primary Key 	Unique ID for the user.
name	string	Not Null	Specify Name.
email	string	Not Null (Unique)	Stores Email ID.
password	string	Not Null	Specify Password.
role	string	Not Null	Specify user role (admin/user/conductor).
createdAt	string	Not Null	Specify Date when it was created.

Table Name : PASSES
Use : It is used to store the information of transit passes.
Field 	Type	Constraints	Description
id 	string	Primary Key	Unique pass ID.
userId	string	Foreign Key	Links to USERS table.
route	string	Not Null	Travel route.
passType	string	Not Null	Monthly/Quarterly/Yearly.
status	string	Not Null	Pending/Active/Expired/Rejected.
validFrom	string	Allow Null	Start Date of Pass.
validUntil	string	Allow Null	End Date of Pass.
qrToken	string	Allow Null	Unique QR string for generation.
price	number	Not Null	Cost of the pass.

Table Name : SCAN_LOGS
Use : It is used to store the records of conductor QR scans.
Field 	Type	Constraints	Description
id 	string	Primary Key	Unique Log ID.
passId	string	Foreign Key	Links to PASSES table.
conductorId	string	Foreign Key	Links to USERS table.
scannedAt	string	Not Null	Timestamp of scan.
result	string	Not Null	Valid, Expired, Invalid.



Screen Layouts:-

Home page:-
The landing page detailing features of BharatPass, with a call to action to Login and demo credentials presented.

Login:-
A secure login form accepting an email and password, which validates credentials and redirects the user to their respective role dashboard.

User Dashboard:-
A tabbed layout showing "My Passes", "Apply for Pass", and "My Payments". Users can see active passes represented as digital cards with QR download buttons.

Payment Modal:-
An overlay simulating a payment gateway where users confirm their amount before pass creation.

Admin Dashboard:-
A comprehensive panel containing statistics cards (total users, active passes, revenue) and tabs to list all users, manage pending passes, and view continuous scan logs.

Conductor Scanner:-
A specialized screen containing a live camera feed viewport, reading QR frames, and displaying a result card (Green for valid, Red for invalid) immediately upon scanning.


	6
Chapter
________________________________________
References

	
	
 



All the needed information related to my project “BharatPass (QR-Based Bus/Train Pass Management System)” was being clumped from the following sources:
	Books:

•	For Node.js and Express

	Node.js Design Patterns
	Express in Action

	Sites URL:-

•	For Frontend (HTML, CSS, JS)

	https://developer.mozilla.org/
	https://www.w3schools.com/

•	For Node and NPM Libraries

	https://nodejs.org/en/docs/
	https://www.npmjs.com/package/qrcode
	https://github.com/cozmo/jsQR

•	For Hosting

	https://docs.netlify.com/
