const { User, Book } = require("../models");
const { AuthenticationError } = require('apollo-server-express');
const { signToken } = require("../utils/authrevise")

const resolvers = {
    Query: {
        me: async (parent, args, context) => {
            if (context.user) {
                const userData = await User.findOne({})
                    .populate('savedBooks');

                return userData;
            }

            throw new AuthenticationError('Not logged in');
        },
        // find all users
        users: async () => {
            return User.find()
                .populate('savedBooks')
        },
        // find single user by _id or username
        user: async (parent, { _id, username }) => {
            return User.findOne({ _id, username })
                .populate('savedBooks')
        },
        // find all books

    },

    Mutation: {
        addUser: async (parent, args) => {
            const user = await User.create(args)
            const token = signToken(user);
            return { token, user }; // what is this destructing from? data.token ?
        },
        login: async (parent, { email, password }) => {
            const user = await User.findOne({ email });

            if (!user) {
                throw new AuthenticationError('Incorrect credentials');
            }

            const correctPw = await user.isCorrectPassword(password);

            if (!correctPw) {
                throw new AuthenticationError('Incorrect credentials');
            }

            const token = signToken(user);

            return { token, user };
        },
        saveBook: async (parent, { input }, context) => {
            if (context.user) {
                const updatedUser = await User.findOneAndUpdate(
                    { _id: context.user._id },
                    { $addToSet: { savedBooks: { input } } },
                    { new: true, runValidators: true }
                )
                return updatedUser;
            }

            throw new AuthenticationError('You need to be logged in.')
        },
        removeBook: async (parent, { bookId }, context) => {
            if (context.user) {
                const updatedUser = await User.findOneAndUpdate(
                    { _id: context.user._id },
                    { $pull: { savedBooks: { bookId } } },
                    { new: true }
                )
                return updatedUser
            }
        }
    }
};

module.exports = resolvers;