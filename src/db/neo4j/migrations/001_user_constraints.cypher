// Create constraints for User nodes
CREATE CONSTRAINT user_email IF NOT EXISTS
FOR (user:User) REQUIRE user.email IS UNIQUE;

CREATE CONSTRAINT user_id IF NOT EXISTS
FOR (user:User) REQUIRE user.id IS UNIQUE; 