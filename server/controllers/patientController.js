const { Patient, Visit, Diagnosis, Owner, User } = require('../models');

exports.getPatientById = async (req, res) => {
  try {
    const patient = await Patient.findByPk(req.params.id, {
      include: [
        {
          model: Visit,
          as: 'visits',
          include: [
            { model: Diagnosis, as: 'diagnosis' },
            { model: User, as: 'doctor', attributes: ['id', 'fullName'] }
          ],
          order: [['date', 'DESC']]
        },
        {
          model: Owner,
          as: 'owner'
        }
      ]
    });

    if (!patient) {
      return res.status(404).json({ success: false, message: 'Пациент не найден' });
    }

    res.json({ success: true, patient });
  } catch (error) {
    console.error('Ошибка получения пациента:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
};
