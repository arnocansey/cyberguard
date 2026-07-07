import Joi from "joi";
import { StatusCodes } from "http-status-codes";
import { chatAssist } from "../services/chat.service.js";

const assistSchema = Joi.object({
  message: Joi.string().trim().min(2).max(1500).required(),
  history: Joi.array()
    .items(
      Joi.object({
        role: Joi.string().valid("user", "assistant").required(),
        content: Joi.string().trim().min(1).max(1500).required()
      })
    )
    .max(12)
    .default([])
});

export const postAssist = async (req, res, next) => {
  try {
    const { value, error } = assistSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "Validation error",
        details: error.details.map((d) => d.message)
      });
    }

    const data = await chatAssist({
      userId: req.user.sub,
      message: value.message,
      history: value.history,
      tenantId: req.tenantId
    });

    return res.status(StatusCodes.OK).json(data);
  } catch (error) {
    return next(error);
  }
};
