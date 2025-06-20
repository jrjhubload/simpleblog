import React, { useState, useEffect } from 'react';
import logo from './Nest.png';

function App() {
  const [posts, setPosts] = useState([]);
  const [currentPost, setCurrentPost] = useState(null);
  const [showForm, setShowForm] = useState(false); // This state is no longer strictly needed due to currentPage
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [image, setImage] = useState(null); // New state for image file
  const [imageUrl, setImageUrl] = useState(''); // New state for displaying existing image URL
  const [notification, setNotification] = useState({ message: '', type: '' });
  const [currentPage, setCurrentPage] = useState('list'); // 'list', 'create', 'view', 'edit'

  const API_BASE_URL = 'http://localhost:8000/api/posts/'; // Django API endpoint

  // Effect to fetch posts when the component mounts or when an operation completes
  useEffect(() => {
    if (currentPage === 'list') {
      fetchPosts();
    }
  }, [currentPage]); // Dependency on currentPage to re-fetch when returning to list view

  // Function to show a notification message
  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification({ message: '', type: '' });
    }, 3000); // Hide after 3 seconds
  };

  // Fetch all posts from the Django API
  const fetchPosts = async () => {
    try {
      const response = await fetch(API_BASE_URL);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setPosts(data);
    } catch (error) {
      console.error("Error fetching posts:", error);
      showNotification("Failed to fetch posts.", "error");
    }
  };

  // Fetch a single post by ID
  const fetchPostById = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}${id}/`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setCurrentPost(data);
      setTitle(data.title); // Pre-fill for potential edit
      setContent(data.content); // Pre-fill for potential edit
      setImageUrl(data.image); // Set existing image URL
      setImage(null); // Clear file input when viewing/editing
      setCurrentPage('view'); // Change to view page
    } catch (error) {
      console.error("Error fetching post:", error);
      showNotification("Failed to fetch post details.", "error");
    }
  };

  // Handle form submission for creating or updating a post
  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    if (image) {
      formData.append('image', image);
    } else if (imageUrl && currentPage === 'edit' && !image) {
      // If no new image is selected but an old one exists, retain it
      // Django REST Framework's ModelSerializer handles this correctly if the field is not sent
      // but explicitly setting it to null if the user removed it, or not appending if keeping old
    }


    let method = 'POST';
    let url = API_BASE_URL;

    if (currentPost && currentPage === 'edit') {
      method = 'PUT';
      url = `${API_BASE_URL}${currentPost.id}/`;
    }

    try {
      const response = await fetch(url, {
        method: method,
        // When sending FormData, do NOT set 'Content-Type': 'application/json'
        // The browser will set the correct 'multipart/form-data' header automatically,
        // including the boundary string.
        body: formData,
      });

      if (!response.ok) {
        // Attempt to parse error response from Django
        const errorData = await response.json();
        console.error(`Error ${currentPost ? 'updating' : 'creating'} post:`, errorData);
        throw new Error(`HTTP error! status: ${response.status}, Details: ${JSON.stringify(errorData)}`);
      }

      showNotification(`Post ${currentPost ? 'updated' : 'created'} successfully!`, "success");
      setTitle('');
      setContent('');
      setImage(null); // Clear image input
      setImageUrl(''); // Clear image URL
      setCurrentPost(null); // Clear current post after operation
      setShowForm(false); // Hide form
      setCurrentPage('list'); // Go back to list view
    } catch (error) {
      console.error(`Error ${currentPost ? 'updating' : 'creating'} post:`, error);
      showNotification(`Failed to ${currentPost ? 'update' : 'create'} post.`, "error");
    }
  };

  // Handle deleting a post
  const handleDelete = async (id) => {
    // Implement a custom modal/message box instead of window.confirm for better UX.
    // For now, let's keep it simple as instructed to avoid direct prompts.
    // In a real app, this would trigger a confirmation modal.
    // As per instruction: DO NOT use confirm(). The code is running in an iframe and the user will NOT see the confirmation dialog.
    // For this demonstration, we'll proceed directly or you can add a custom modal component.

    // Removed `if (window.confirm("Are you sure you want to delete this post?")) { ... }`
    // Proceed with deletion directly or prompt user with a custom modal.
    try {
      const response = await fetch(`${API_BASE_URL}${id}/`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      showNotification("Post deleted successfully!", "success");
      setCurrentPage('list'); // Re-fetch list
    } catch (error) {
      console.error("Error deleting post:", error);
      showNotification("Failed to delete post.", "error");
    }
  };


  // Show create form
  const handleCreateNew = () => {
    setCurrentPost(null); // Ensure no post is selected for editing
    setTitle('');
    setContent('');
    setImage(null); // Clear image input
    setImageUrl(''); // Clear image URL
    setShowForm(true); // Still useful for general form visibility state, though currentPage is primary
    setCurrentPage('create');
  };

  // Show edit form for an existing post
  const handleEdit = (post) => {
    setCurrentPost(post);
    setTitle(post.title);
    setContent(post.content);
    setImage(null); // Clear file input when editing, new image can be selected
    setImageUrl(post.image); // Set current image URL for display
    setShowForm(true); // Still useful for general form visibility state
    setCurrentPage('edit');
  };

  // Handle file input change
  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
      // Optionally, set a preview URL for the new image
      // setImageUrl(URL.createObjectURL(e.target.files[0]));
    }
  };


  // Render the post list
  const renderPostList = () => (
    <div className="p-4 max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Blog Posts</h2>
      <button
        onClick={handleCreateNew}
        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 mb-6 block mx-auto"
      >
        Create New Post
      </button>

      {posts.length === 0 ? (
        <p className="text-center text-gray-600 text-lg">No posts yet. Be the first to create one!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <div key={post.id} className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col justify-between">
              {post.image && (
                <div className="relative w-full h-48 overflow-hidden">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{post.title}</h3>
                <p className="text-gray-600 text-sm mb-4">Published: {new Date(post.published_date).toLocaleDateString()}</p>
                {/* Truncate content for list view */}
                <p className="text-gray-700 leading-relaxed truncate-3-lines">{post.content}</p>
              </div>
              <div className="p-6 pt-0 flex justify-end gap-3">
                <button
                  onClick={() => fetchPostById(post.id)}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-md shadow-sm transition duration-300"
                >
                  View
                </button>
                <button
                  onClick={() => handleEdit(post)}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-4 rounded-md shadow-sm transition duration-300"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(post.id)}
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-md shadow-sm transition duration-300"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Render the post form (for create/edit)
  const renderPostForm = () => (
    <div className="p-4 max-w-xl mx-auto bg-white rounded-lg shadow-xl mt-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        {currentPost ? 'Edit Post' : 'Create New Post'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-gray-700 text-sm font-bold mb-2">
            Title:
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500"
            required
          />
        </div>
        <div>
          <label htmlFor="content" className="block text-gray-700 text-sm font-bold mb-2">
            Content:
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows="10"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500"
            required
          ></textarea>
        </div>
        <div>
            <label htmlFor="image" className="block text-gray-700 text-sm font-bold mb-2">
                Image:
            </label>
            <input
                type="file"
                id="image"
                accept="image/*"
                onChange={handleImageChange}
                className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
            />
            {imageUrl && !image && ( // Display existing image if no new one is selected
                <p className="text-sm text-gray-600 mt-2">Current image: <a href={imageUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">View Image</a></p>
            )}
            {image && ( // Display preview for newly selected image
                <p className="text-sm text-gray-600 mt-2">New image selected: {image.name}</p>
            )}
        </div>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setCurrentPage('list')} // Cancel button goes back to list
            className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-md shadow-sm transition duration-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-md shadow-md transition duration-300 ease-in-out transform hover:scale-105"
          >
            {currentPost ? 'Update Post' : 'Create Post'}
          </button>
        </div>
      </form>
    </div>
  );

  // Render a single post view
  const renderPostView = () => (
    <div className="p-6 max-w-2xl mx-auto bg-white rounded-lg shadow-xl mt-8">
      {currentPost ? (
        <>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">{currentPost.title}</h2>
          <p className="text-gray-600 text-sm mb-6">Published: {new Date(currentPost.published_date).toLocaleDateString()}</p>
          {currentPost.image && (
            <div className="mb-6">
              <img
                src={currentPost.image}
                alt={currentPost.title}
                className="max-w-full h-auto rounded-lg shadow-md"
              />
            </div>
          )}
          <div className="prose max-w-none text-gray-800 leading-relaxed mb-8">
            <p>{currentPost.content}</p> {/* Display full content */}
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => handleEdit(currentPost)}
              className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-4 rounded-md shadow-sm transition duration-300"
            >
              Edit
            </button>
            <button
              onClick={() => handleDelete(currentPost.id)}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-md shadow-sm transition duration-300"
            >
              Delete
            </button>
            <button
              onClick={() => setCurrentPage('list')} // Back button goes to list
              className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-md shadow-sm transition duration-300"
            >
              Back to List
            </button>
          </div>
        </>
      ) : (
        <p className="text-center text-gray-600 text-lg">Post not found.</p>
      )}
    </div>
  );


  return (
    // Tailwind CSS setup for responsive design and basic styling
    <div className="min-h-screen bg-gray-100 font-sans antialiased flex flex-col">
      {/* Tailwind CSS CDN and Font Import */}
      <script src="https://cdn.tailwindcss.com"></script>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />
      {/* Inline CSS for custom styles */}
      <style>
        {`
        body { font-family: 'Inter', sans-serif; }
        .truncate-3-lines {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .notification {
          position: fixed;
          top: 20px;
          right: 20px;
          padding: 12px 20px;
          border-radius: 8px;
          color: white;
          font-weight: 500;
          z-index: 1000;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          animation: fadeInOut 3s forwards;
        }
        .notification.success {
          background-color: #4CAF50; /* Green */
        }
        .notification.error {
          background-color: #f44336; /* Red */
        }
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translateY(-20px); }
          10% { opacity: 1; transform: translateY(0); }
          90% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-20px); }
        }
        `}
      </style>

      {/* UPDATED HEADER SECTION */}
      <header className="bg-gradient-to-r from-gray-900 to-gray-700 text-white p-6 shadow-lg">
        <div className="container mx-auto flex items-center justify-center">
          {/* Nest Technologies Logo - REPLACE THE SRC WITH YOUR ACTUAL LOGO PATH */}
          <img
            src={logo} // <== IMPORTANT: Replace with the actual path to your logo file
            alt="Nest Technologies Logo"
            className="h-10 mr-4" // Adjust height (h-*) and right margin (mr-*) as needed
          />
          <h1 className="text-4xl font-bold">Customer Portal</h1>
        </div>
      </header>

      {/* Notification Display */}
      {notification.message && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}

      <main className="container mx-auto my-8 p-4">
        {/* Conditional rendering based on currentPage state */}
        {currentPage === 'list' && renderPostList()}
        {(currentPage === 'create' || currentPage === 'edit') && renderPostForm()}
        {currentPage === 'view' && renderPostView()}
      </main>

      <footer className="bg-gray-800 text-white p-6 text-center mt-auto">
        <p>&copy; {new Date().getFullYear()} My Blog. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;