const CLIENT_FIELDS = [
    "name", "is_company", "company_type", "lang", "mobile", "phone", "vat", "email",
    "street", "city", "customer_rank", "country_id", "company_id"
    // ...otros campos de cliente
];

const BANK_FIELDS = [
    "bank_name", "bic"
    // ...otros campos de banco
];

const BANK_ACCOUNT_FIELDS = [
    "acc_number", "currency_id", "company_id"
    // ...otros campos de cuenta bancaria
];

module.exports = {
    CLIENT_FIELDS,
    BANK_FIELDS,
    BANK_ACCOUNT_FIELDS
};