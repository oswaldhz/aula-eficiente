import { useState, useEffect } from "react";
import { fetchData, postData } from "../api";

export default function Teachers() {
  const [teachers, setTeachers] = useState([]);
  const [form, setForm] = useState({ name: "", email: "" });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", email: "" });

  useEffect(() => {
    fetchData("teachers").then(setTeachers);
  }, []);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    const newTeacher = await postData("teachers", form);
    setTeachers([...teachers, { id: newTeacher.id, ...form }]);
    setForm({ name: "", email: "" });
  };

  // -------------------- FUNCIONES CRUD AGREGADAS --------------------

  const updateTeacher = async (id, updatedData) => {
    const res = await fetch(`http://127.0.0.1:5000/teachers/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedData)
    });
    await res.json();
    setTeachers(teachers.map(t => t.id === id ? { ...t, ...updatedData } : t));
    setEditingId(null);
  };

  const deleteTeacher = async (id) => {
    const res = await fetch(`http://127.0.0.1:5000/teachers/${id}`, {
      method: "DELETE"
    });
    if (res.ok) {
      setTeachers(teachers.filter(t => t.id !== id));
    }
  };

  return (
    <div>
      <h2>Teachers</h2>
      <form onSubmit={handleSubmit}>
        <input name="name" placeholder="Name" value={form.name} onChange={handleChange} required />
        <input name="email" placeholder="Email" value={form.email} onChange={handleChange} required />
        <button type="submit">Add Teacher</button>
      </form>
      <ul>
        {teachers.map(t => (
          <li key={t.id}>
            {editingId === t.id ? (
              <>
                <input
                  value={editForm.name}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                />
                <input
                  value={editForm.email}
                  onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                />
                <button onClick={() => updateTeacher(t.id, editForm)}>Save</button>
                <button onClick={() => setEditingId(null)}>Cancel</button>
              </>
            ) : (
              <>
                {t.name} ({t.email})
                <button onClick={() => { setEditingId(t.id); setEditForm({ name: t.name, email: t.email }); }}>Edit</button>
                <button onClick={() => deleteTeacher(t.id)}>Delete</button>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
