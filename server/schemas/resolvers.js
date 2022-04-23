const { User, Book } = require("../models");
const { AuthenticationError } = require('apollo-server-express');
const { signToken } = require("../utils/auth")

const resolvers = {
    Query: {
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
    },

    Mutation: {
        addUser: async (parent, args) => {
            const user = await User.create(args)
            const token = signToken(user);
            return { token, user }; // what is this destructing from? 
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
        saveBook: async (parent, { userId, BookInput }, context) => {
            if (context.user) {
                const updatedUser = await User.findOneAndUpdate(
                    { _id: userId },
                    { $push: { savedBooks: { BookInput } } },
                    { new: true, runValidators: true }
                )
                return updatedUser;
            }

            throw new AuthenticationError('You need to be logged in.')
        },
    }
};

module.exports = resolvers;