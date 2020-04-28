// import express from "express";
// React apps get Transpiled
// This version of NodeJS does support import statements and there is no transpilation step

const serverlessHttp = require("serverless-http");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const mysql = require("mysql");

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: "tech_returner",
});

// Logically separate 4 sections of code according to the method of the HTTP request received

// Export a single function, called app

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.get("/tasks", function (request, response) {
  // Should make a SELECT * FROM Tasks query to the DB and return the results
  connection.query("SELECT * FROM TASK", function (err, data) {
    if (err) {
      console.log("Error from MySQL", err);
      response.status(500).send(err);
    } else {
      response.status(200).send(data);
    }
  });
});

app.delete("/tasks/:id", function (request, response) {
  const id = request.params.id;
  const query = `DELETE FROM TASK WHERE task_id = ?`;

  connection.query(query, [id], function (err, data) {
    if (err) {
      console.log("Error from MySQL while Deleting", err);
      response.status(500).send(err);
    } else {
      response.status(200).send(`Deleted task with ID ${id}!`);
    }
  });
});

/*
{
	"Description": "Wash the dog",
	"DueDate": "2020-04-24",
	"Urgent": true
}
*/
app.post("/tasks", function (request, response) {
  const data = request.body;

  // SQL Injection - avoid this by "escaping" user-provided values
  const query = `INSERT INTO TASK (user_id, task_text, priority,due_date,completed) VALUES (?, ?, ?, ?, ?)`;
  connection.query(
    query,
    [data.userId, data.text, data.priority, data.dueDate, data.completed],
    function (err, results) {
      if (err) {
        console.log("Error from MySQL while inserting task", err);
        response.status(500).send(err);
      } else {
        // Send back the newly created task
        // Because the frontend (or whatever client) might want to know the ID
        connection.query(`SELECT * FROM TASK WHERE task_id = ${results.insertId}`, function (
          err,
          results
        ) {
          if (err) {
            console.log("Error from MySQL", err);
            response.status(500).send(err);
          } else {
            response.status(201).send(results[0]);
          }
        });
      }
    }
  );
});

app.put("/tasks/:id", function (request, response) {
  const id = request.params.id;
  const data = request.body;

  // SQL Injection - avoid this by "escaping" user-provided values
  const query = `UPDATE TASK set task_text = ?, priority = ?, due_date = ? , completed = ? WHERE task_id = ?`;
  connection.query(query, [data.text, data.priority, data.dueDate, data.completed, id], function (
    err,
    results
  ) {
    if (err) {
      console.log("Error from MySQL while inserting task", err);
      response.status(500).send(err);
    } else {
      response.status(200).send(`Updated task with ID ${id} and data ${JSON.stringify(data)}`);
    }
  });
  // Write an SQL query to update the fields provided in the request for the task WHERE TaskId = id
  // Remember to escape user-provided values
  // Send back 200 (not the updated task)
});

module.exports.app = serverlessHttp(app);
