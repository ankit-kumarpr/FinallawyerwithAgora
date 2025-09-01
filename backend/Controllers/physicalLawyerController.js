const PhysicalLawyer = require('../Models/phoysicallawyer');
const path = require('path');

// Generate next lawyerId like phylawyer001
async function generateLawyerId() {
  const lastLawyer = await PhysicalLawyer.findOne().sort({ createdAt: -1 });
  let nextNumber = 1;

  if (lastLawyer && lastLawyer.lawyerId) {
    const lastNumber = parseInt(lastLawyer.lawyerId.replace('phylawyer', ''));
    nextNumber = lastNumber + 1;
  }

  return 'phylawyer' + nextNumber.toString().padStart(3, '0');
}

const createPhysicalLawyer = async (req, res) => {
  try {
    const lawyerId = await generateLawyerId();
    const profileImage = req.file ? req.file.filename : '';

    const newLawyer = new PhysicalLawyer({
      ...req.body,
      lawyerId,
      profileImage
    });

    await newLawyer.save();
    res.status(201).json({ message: 'Physical lawyer created successfully', data: newLawyer });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAllPhysicalLawyers = async (req, res) => {
  try {
    const lawyers = await PhysicalLawyer.find();
    res.status(200).json(lawyers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getPhysicalLawyerById = async (req, res) => {
  try {
    const lawyer = await PhysicalLawyer.findById(req.params.id);
    if (!lawyer) return res.status(404).json({ message: 'Lawyer not found' });
    res.status(200).json(lawyer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updatePhysicalLawyer = async (req, res) => {
  try {
    const {id}=req.params;
    const updateData = req.body;

 

    const lawyer = await PhysicalLawyer.findByIdAndUpdate(id, updateData, { new: true });

    if (!lawyer) return res.status(404).json({ message: 'Lawyer not found' });

    res.status(200).json({ message: 'Lawyer updated successfully', data: lawyer });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deletePhysicalLawyer = async (req, res) => {
  try {
    const lawyer = await PhysicalLawyer.findByIdAndDelete(req.params.id);
    if (!lawyer) return res.status(404).json({ message: 'Lawyer not found' });
    res.status(200).json({ message: 'Lawyer deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


module.exports={
    deletePhysicalLawyer,
    updatePhysicalLawyer,
    getPhysicalLawyerById,
    getAllPhysicalLawyers,
    createPhysicalLawyer
    
}