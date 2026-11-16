# ⚙️ BookNook – Backend API

The BookNook backend is a RESTful API built with Express.js and MongoDB. It handles book management, borrowing operations, authentication, and database interactions for the BookNook library platform.

🌐 **Live API:** https://booknook-server-64vj.onrender.com

## ✨ Features

- 📖 Create, read, update, and delete books.
- 🔐 JWT-based authentication using Better Auth.
- 👤 User-specific book management.
- 📚 Borrow and return books.
- 🔄 Automatic available-copy updates.
- 🛡️ Protected API routes and ownership verification.
- ✅ Request validation and error handling.
- 🚫 Prevent duplicate active borrowing records.

## 🛠️ Technologies Used

- Node.js
- Express.js
- JavaScript
- MongoDB
- MongoDB Native Driver
- Better Auth JWT
- JOSE
- CORS
- dotenv

## 📂 Project Structure

```text
booknook-server/
├── src/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── bookController.js
│   │   └── borrowController.js
│   ├── middleware/
│   │   └── verifyToken.js
│   ├── routes/
│   │   ├── bookRoutes.js
│   │   └── borrowRoutes.js
│   └── server.js
├── .env
├── .gitignore
└── package.json
```

## 🔗 API Endpoints

### 📖 Books

| Method | Endpoint | Description |
|---|---|---|
| GET | `/books` | Get all books |
| GET | `/books/:id` | Get book details |
| GET | `/books?mine=true` | Get your books |
| POST | `/books` | Add a book |
| PATCH | `/books/:id` | Update a book |
| DELETE | `/books/:id` | Delete a book |

### 📚 Borrowing

| Method | Endpoint | Description |
|---|---|---|
| POST | `/borrows` | Borrow a book |
| GET | `/borrows` | Get your borrowed books |
| DELETE | `/borrows/:id` | Return a book |

🔒 Protected endpoints require a valid JWT access token.

## 🗄️ Database

BookNook uses MongoDB Atlas with two main collections:

- **Books:** Stores book information, copy counts, and ownership details.
- **Borrows:** Stores borrowing records, user references, and borrowing status.

A partial unique index prevents duplicate active borrowing records for the same user and book.

## 🚀 Deployment

- **Frontend:** Vercel
- **Backend:** Render
- **Database:** MongoDB Atlas

## 👨‍💻 Author

**Maksudur Rahman**

- GitHub: [@maksudurrhmn](https://github.com/maksudurrhmn)

---

⭐ Built with ❤️ for BookNook.
