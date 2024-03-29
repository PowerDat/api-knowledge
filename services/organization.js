const db = require("./db");
const helper = require("../helper");

async function getOrganizationGroup() {
  const rows = await db.query(
    `SELECT organization_code AS value, 
            organization_name_th AS label
    FROM us_organization WHERE organization_parent_id = 0000 AND organization_code != 0000`
  );
  const data = helper.emptyOrRows(rows);
  data.map((item) => {
    item.value = Number(item.value);
  });
  return data;
}

module.exports = {
  getOrganizationGroup,
};
