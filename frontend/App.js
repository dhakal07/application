import React, { useState, useEffect } from "react";
import axios from "axios";

const App = () => {
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({ name: "", email: "", age: "" });

  useEffect(() => {
    axios.get("http://localhost:5000/users").then((response) => {
      setUsers(response.data);
    });
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    axios
      .post("http://localhost:5000/add-user", formData)
      .then(() => {
        setUsers([...users, formData]);
        setFormData({ name: "", email: "", age: "" });
      })
      .catch((error) => console.error("Error:", error));
  };

  return (
    <div className="container mt-4">
      <h2 className="mb-4">User Management</h2>

      <form onSubmit={handleSubmit} className="mb-4">
        <input type="text" name="name" placeholder="Name" className="form-control mb-2" onChange={handleChange} value={formData.name} required />
        <input type="email" name="email" placeholder="Email" className="form-control mb-2" onChange={handleChange} value={formData.email} required />
        <input type="number" name="age" placeholder="Age" className="form-control mb-2" onChange={handleChange} value={formData.age} required />
        <button type="submit" className="btn btn-primary">Add User</button>
      </form>

      <h3>Users List</h3>
      <ul className="list-group">
        {users.map((user, index) => (
          <li key={index} className="list-group-item">
            {user.name} ({user.email}) - {user.age} years old
          </li>
        ))}
      </ul>
    </div>
  );
};

export default App;
