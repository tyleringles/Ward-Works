

const mongoose = require('mongoose'); 
const User = require('../models/User');
//^^ to help me work with mongoose, then a mongoose modle for the user

// FUNCTION used is loadSortedUsers this load all users from the database in a consistent, sorted order to display on the manage users page that only admins have acess to 
// Using populate + lean + sorted lists like this felt advanced than the examples in class, was a little more challenging to fully learn but was more effective
async function loadSortedUsers() {
  return User.find({})
    .populate('member')
    .sort({ role: -1, email: 1 })
    .lean();
}




//   Exports.userList the admin "Manage Users" page with a full list of users.

exports.userList = async (req, res) => {
  try {
    const users = await loadSortedUsers();

    res.render('admin/users', {
      title: 'Manage Users',
      users,
      error: null,
      success: null
    });
  } catch (err) {
    console.error('Error loading users for admin:', err);

    res.render('admin/users', {
      title: 'Manage Users',
      users: [],
      error: 'There was a problem loading users. Please try again.',
      success: null
    });
  }
};



//  The exports.updateRole updates a single user's role 
exports.updateUserRole = async (req, res) => {
  try {

    const userId = req.params.id;
    const { role } = req.body;

    const allowedRoles = ['member', 'admin'];

    // Validate the roll input if it dosen't then it returns an error

    if (!role || !allowedRoles.includes(role)) {
      console.warn('Invalid role submitted:', role);

      const users = await loadSortedUsers();

      return res.status(400).render('admin/users', {
        title: 'Manage Users',
        users,
        error: 'Invalid role selected. Please choose a valid role.',
        success: null
      });
    }


    // This section Validates user ID other wise error
    if (!userId || !mongoose.isValidObjectId(userId)) {
      console.warn('Invalid user ID submitted:', userId);

      const users = await loadSortedUsers();

      return res.status(400).render('admin/users', {
        title: 'Manage Users',
        users,
        error: 'Invalid user selected. Please try again.',
        success: null
      });
    }

 
    const user = await User.findById(userId);

    if (!user) {
      console.warn('User not found for ID:', userId);

      const users = await loadSortedUsers();

      return res.status(404).render('admin/users', {
        title: 'Manage Users',
        users,
        error: 'User not found. It may have been deleted.',
        success: null
      });
    }

    user.role = role;
    await user.save();

    if (
      req.session.user &&
      (req.session.user._id === userId || req.session.user.id === userId)
    ) {
      req.session.user.role = role;
    }

 
    const users = await loadSortedUsers();

    res.render('admin/users', {
      title: 'Manage Users',
      users,
      error: null,
      success: 'User role updated successfully.'
    });
  } catch (err) {
    console.error('Error updating user role:', err);

    try {

      const users = await loadSortedUsers();

      return res.status(500).render('admin/users', {
        title: 'Manage Users',
        users,
        error: 'There was a problem updating the user role. Please try again.',
        success: null
      });
    } catch (loadErr) {
      console.error('Error reloading users after role update failure:', loadErr);
      return res
        .status(500)
        .send('Unexpected error while updating user role.');
    }
  }
};
