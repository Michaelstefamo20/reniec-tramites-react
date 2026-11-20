import { notificationRepository } from "../repositories/notificationRepository.js";

export const notifyAccount=(accountId,notification)=>notificationRepository.create({accountId,...notification});
