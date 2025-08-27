import { useState, useEffect } from "react";
import { fetchData, postData, deleteData } from "../api";

export default function Students() {
  const [students, setStudents] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [form, setForm] = useState({ name: "", identifier: "", classroom_id: "" });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", identifier: "", classroom_id: "" });

  // --------------------- Cargar datos ---------------------
  useEffect(() => {
    fetchData("students").then(setStudents);
    fetchData("classrooms").then(setClassrooms);
  }, []);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    const newStudent = await postData("students", form);
    setStudents([...students, { id: newStudent.id, ...form }]);
    setForm({ name: "", identifier: "", classroom_id: "" });
  };

  // --------------------- CRUD FUNCIONES ---------------------
  const updateStudent = async (id, updatedData) => {
    const res = await fetch(`http://127.0.0.1:5000/students/${id}/`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedData)
    });
    await res.json();
    setStudents(students.map(s => s.id === id ? { ...s, ...updatedData } : s));
    setEditingId(null);
  };

  const deleteStudent = async id => {
    await fetch(`http://127.0.0.1:5000/students/${id}/`, { method: "DELETE" });
    setStudents(students.filter(s => s.id !== id));
  };

  return (
    <div>
      <h2>Students</h2>

      <form onSubmit={handleSubmit}>
        <input name="name" placeholder="Name" value={form.name} onChange={handleChange} required />
        <input name="identifier" placeholder="Identifier" value={form.identifier} onChange={handleChange} required />
        <select name="classroom_id" value={form.classroom_id} onChange={handleChange} required>
          <option value="">Select Classroom</option>
          {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button type="submit">Add Student</button>
      </form>

      <ul>
        {students.map(s => (
          <li key={s.id}>
            {editingId === s.id ? (
              <>
                <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
                <input value={editForm.identifier} onChange={e => setEditForm({ ...editForm, identifier: e.target.value })} />
                <select value={editForm.classroom_id} onChange={e => setEditForm({ ...editForm, classroom_id: e.target.value })}>
                  <option value="">Select Classroom</option>
                  {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <button onClick={() => updateStudent(s.id, editForm)}>Save</button>
                <button onClick={() => setEditingId(null)}>Cancel</button>
              </>
            ) : (
              <>
                {s.name} ({s.identifier}) - Classroom ID: {s.classroom_id}
                <button onClick={() => { setEditingId(s.id); setEditForm({ name: s.name, identifier: s.identifier, classroom_id: s.classroom_id }); }}>Edit</button>
                <button onClick={() => deleteStudent(s.id)}>Delete</button>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
