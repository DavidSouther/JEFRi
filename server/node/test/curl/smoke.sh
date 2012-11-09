#!/bin/sh

curl -H "Content-Type:application/json" --data '{"context": "http://souther.co/EntityContext.json"}' localhost:3000/load/
curl -H "Content-Type:application/json" --data '{"attributes":{},"entities":[{"_type":"User","user_id":"73e39d31-23f6-4ffc-a14c-cfa1d82fadd4","name":"southerd","address":"davidsouther@gmail.com"},{"_type":"Authinfo","authinfo_id":"2b4123b7-ae7b-4e5d-bc4b-75327947467c","user_id":"73e39d31-23f6-4ffc-a14c-cfa1d82fadd4","username":"","password":"","activated":"","banned":"","ban_reason":"","new_password_key":"","new_password_requested":"","new_email":"","new_email_key":"","last_ip":"","last_login":"","created":"","modified":""}]}' localhost:3000/persist
curl -H "Content-Type:application/json" --data '{"entities":[{"_type":"User", "authinfo": {}}]}' localhost:3000/get/
