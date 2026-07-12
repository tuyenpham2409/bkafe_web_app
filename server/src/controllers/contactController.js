import Contact from '../models/Contact.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { asyncHandler } from '../middlewares/errorHandler.js';
import { env } from '../config/env.js';


export const createContact = asyncHandler(async (req, res) => {
  const { name, email, message } = req.body;
  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return res.status(400).json({ message: 'Vui lòng điền đầy đủ họ tên, email và nội dung.' });
  }
  
  const media = (req.files || []).map((f) => ({
    type: f.mimetype.startsWith('video') ? 'video' : 'image',
    url: `${env.apiUrl}/uploads/${f.filename}`,
  }));
  await Contact.create({
    name: name.trim(),
    email: email.trim(),
    message: message.trim(),
    user: req.user?._id || null,
    media,
  });
  
  const admins = await User.find({ role: 'admin' }).select('_id').lean();
  await Promise.all(
    admins.map((a) =>
      Notification.create({
        user: a._id,
        type: 'new_contact',
        title: 'Có góp ý mới',
        message: `${name.trim()} vừa gửi một góp ý mới.`,
        link: '/about',
      })
    )
  );
  res.status(201).json({ message: 'Cảm ơn bạn đã gửi ý kiến! Chúng tôi sẽ phản hồi sớm nhất.' });
});


export const listContacts = asyncHandler(async (_req, res) => {
  const contacts = await Contact.find().sort({ createdAt: -1 }).lean();
  res.json(
    contacts.map((c) => ({
      id: String(c._id),
      name: c.name,
      email: c.email,
      message: c.message,
      handled: c.handled,
      createdAt: c.createdAt,
      media: c.media || [],
    }))
  );
});


export const toggleHandled = asyncHandler(async (req, res) => {
  const c = await Contact.findById(req.params.id);
  if (!c) return res.status(404).json({ message: 'Không tìm thấy liên hệ.' });
  c.handled = !c.handled;
  await c.save();
  res.json({ id: String(c._id), handled: c.handled });
});


export const deleteContact = asyncHandler(async (req, res) => {
  const c = await Contact.findByIdAndDelete(req.params.id);
  if (!c) return res.status(404).json({ message: 'Không tìm thấy liên hệ.' });
  res.json({ message: 'Đã xoá liên hệ.' });
});
