import { body, validationResult } from 'express-validator';

/**
 * Middleware to check express-validator validation results.
 * Returns 400 Bad Request if validation constraints are violated.
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: errors.array().map((err) => err.msg),
    });
  }
  next();
};

/**
 * Validation rules for sending a message.
 */
export const sendMessageValidator = [
  body('conversationId')
    .trim()
    .notEmpty()
    .withMessage('Conversation ID is required')
    .isMongoId()
    .withMessage('Invalid Conversation ID format'),
  body('receiverId')
    .trim()
    .notEmpty()
    .withMessage('Receiver ID is required')
    .isMongoId()
    .withMessage('Invalid Receiver ID format'),
  body('message')
    .trim()
    .notEmpty()
    .withMessage('Message text cannot be empty')
    .isLength({ max: 2000 })
    .withMessage('Message text cannot exceed 2000 characters'),
  handleValidationErrors,
];
