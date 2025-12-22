/* =========================================================
   API CONFIG
========================================================= */

const API_URL = "http://localhost:3000/api";

const getHeaders = (isMultipart = false) => {
  const token = localStorage.getItem("token");

  const headers = {
    Authorization: token ? `Bearer ${token}` : "",
  };

  if (!isMultipart) {
    headers["Content-Type"] = "application/json";
  }

  return headers;
};

const handleResponse = async (response) => {
  if (!response.ok) {
    let message = `HTTP Error ${response.status}`;
    try {
      const error = await response.json();
      message = error.error || message;
    } catch {}
    throw new Error(message);
  }

  // No content
  if (response.status === 204) return null;

  return response.json();
};

/* =========================================================
   BOOK FETCH
========================================================= */

// Public books
export const getPublicBooks = async () => {
  const res = await fetch(`${API_URL}/books/public`);
  return handleResponse(res);
};

// Logged-in user's books (NOT deleted)
export const getMyBooks = async () => {
  const res = await fetch(`${API_URL}/books/my-books`, {
    headers: getHeaders(),
  });
  return handleResponse(res);
};

// Recycle bin books (DELETED)
export const getTrashBooks = async () => {
  const res = await fetch(`${API_URL}/books/recycle-bin`, {
    headers: getHeaders(),
  });
  return handleResponse(res);
};

/* =========================================================
   CREATE / UPDATE
========================================================= */

export const createBook = async (formData) => {
  const isFormData = formData instanceof FormData;

  const res = await fetch(`${API_URL}/books`, {
    method: "POST",
    headers: getHeaders(isFormData),
    body: isFormData ? formData : JSON.stringify(formData),
  });

  return handleResponse(res);
};

export const updateBook = async (id, formData) => {
  if (!id) throw new Error("Book ID missing");

  const isFormData = formData instanceof FormData;

  const res = await fetch(`${API_URL}/books/${id}`, {
    method: "PUT",
    headers: getHeaders(isFormData),
    body: isFormData ? formData : JSON.stringify(formData),
  });

  return handleResponse(res);
};

/* =========================================================
   TRASH / DELETE LOGIC
========================================================= */

/**
 * ♻️ MOVE TO TRASH (SOFT DELETE)
 * Backend: DELETE /books/:id
 */
export const moveBookToTrash = async (id) => {
  const res = await fetch(`${API_URL}/books/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  return handleResponse(res);
};

/**
 * 🔄 RESTORE FROM TRASH
 * Backend: PUT /books/:id/restore
 */
export const restoreBook = async (id) => {
  const res = await fetch(`${API_URL}/books/${id}/restore`, {
    method: "PUT",
    headers: getHeaders(),
  });
  return handleResponse(res);
};

/**
 * ❌ PERMANENT DELETE
 * Backend: DELETE /books/:id/permanent
 */
export const deleteBookPermanently = async (id) => {
  const res = await fetch(`${API_URL}/books/${id}/permanent`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  return handleResponse(res);
};

/* =========================================================
   SINGLE BOOK
========================================================= */

export const getBook = async (id) => {
  const res = await fetch(`${API_URL}/books/${id}`, {
    headers: getHeaders(),
  });
  return handleResponse(res);
};

/* =========================================================
   AUTH
========================================================= */

export const signIn = async (credentials) => {
  const res = await fetch(`${API_URL}/auth/signin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
  return handleResponse(res);
};

export const signUp = async (userData) => {
  const res = await fetch(`${API_URL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });
  return handleResponse(res);
};

// 🔄 Restore book from Trash
export const restoreTrash = async (id) => {
  const response = await fetch(
    `http://localhost:3000/api/books/${id}/restore`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`
      }
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Restore failed");
  }

  return response.json();
};
