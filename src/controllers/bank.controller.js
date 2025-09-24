const {bankService} = require('../services/bank.service');
const {bankAccountService} = require('../services/BankAccount.service');
// Instancia del servicio externo

const BankController = {

    createBank: async (req, res) => {
        try {
            const bankData = req.body;
            const newBank = await bankService.createBank(bankData, req.user);
            res.status(201).json({ bank: newBank });
        } catch (error) {
            console.error('Error al crear el banco:', error.message);
            res.status(500).json({ error: error.message });
        }
    },

    addBankAccount: async (req, res) => {
        try {
            const result = await bankAccountService.editBankAccount(req.params.id, req.body, "add", req.user);
            res.status(200).json({ status: 200, data: result });
        } catch (error) {
            console.error('Error al editar cuenta bancaria:', error);
            res.status(500).json({ error: error.message });
        }
    },

    deleteBankAccount: async (req, res) => {
        try {
            const result = await bankAccountService.editBankAccount(req.params.id, req.body, "delete", req.user);
            res.status(200).json(result);
        } catch (error) {
            console.error('Error al editar cuenta bancaria:', error);
            res.status(500).json({ error: error.message });
        }
    },

    createAccountBank: async (req, res) => {
        try {
            const bankData = req.body;
            const newBank = await bankAccountService.createBankAccount(bankData, req.user);
            res.status(201).json({ bank: newBank });
        } catch (error) {
            console.error('Error al crear la cuenta bancaria:', error.message);
            res.status(500).json({ error: error.message });
        }
    },
}

module.exports = BankController;