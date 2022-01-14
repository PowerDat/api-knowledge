const db = require("./db");
const helper = require("../helper");

async function getPieChart() {
  const knowledge = await db.query(
    `SELECT count(prk.knowledge_id), prkg.knowledge_group_category  FROM progress_report_knowledge prk 
    inner join progress_report_knowledge_group prkg on prkg.knowledge_group_id = prk.knowledge_group_id
    inner join progress_report pr on pr.progress_report_id = prk.progress_report_id
    inner join concept_proposal cp on cp.concept_proposal_id = pr.concept_proposal_id
    group by prkg.knowledge_group_category`
  );
  const knowledgeData = helper.emptyOrRows(knowledge);
  const knowledgeLabels = knowledgeData.map((item) => {
    return {
      label: item.knowledge_group_category,
    };
  });

  const newKnowledge = await db.query(
    `SELECT * FROM progress_report_outcome_knowledge prok 
    inner join progress_report_outcome pro on pro.outcome_id = prok.outcome_id
    inner join progress_report pr on pr.progress_report_id = pro.progress_report_id
    inner join concept_proposal cp on cp.concept_proposal_id = pr.concept_proposal_id`
  );
  const newKnowledgeData = helper.emptyOrRows(newKnowledge);
  const newKnowledgeLabels = newKnowledgeData.map((item) => {
    return {
      label: item.outcome_knowledge_detail,
      // groups: item.concept_proposal_name_th
    };
  });

  const innovations = await db.query(
    `SELECT * FROM progress_report_output pro 
      INNER JOIN progress_report pr 
      ON pr.progress_report_id = pro.progress_report_id
      inner join concept_proposal cp on cp.concept_proposal_id = pr.concept_proposal_id`
  );
  const newInnovationsData = helper.emptyOrRows(innovations);
  const newInnovationsLabels = newInnovationsData.map((item) => {
    return {
      label: item.output_name,
    };
  });

  const impact = await db.query(`SELECT * FROM bd_outcome_impact;`);
  const impactData = helper.emptyOrRows(impact);
  const impactLabels = impactData.map((item) => {
    return {
      label: item.impact_name,
    };
  });

  const goal = await db.query(`SELECT * FROM bd_sum_goal;`);
  const goalData = helper.emptyOrRows(goal);

  async function getObj(sql, idx, property) {
    const rows = await db.query(sql);
    const data = helper.emptyOrRows(rows);
    const array = data.map((list, index) => {
      return { [list[`${idx}`]]: list[`${property}`] };
    });
    const obj = Object.assign({}, ...array);
    return obj;
  }

  const bcg_obj = await getObj(`SELECT * FROM bd_bcg`, "bcg_id", "bcg_name");
  const sdgs_obj = await getObj(
    `SELECT * FROM bd_sdgs`,
    "sdgs_id",
    "sdgs_name"
  );
  const curve_obj = await getObj(
    `SELECT * FROM bd_10s_curve`,
    "curve_id",
    "curve_name"
  );
  const cluster_obj = await getObj(
    `SELECT * FROM bd_cluster`,
    "cluster_id",
    "cluster_name"
  );

  const uniqueObjects = [
    ...new Map(
      goalData.map((item) => [item.concept_proposal_id, item])
    ).values(),
  ];

  let newCluserlabels = [],
    newCurvelabels = [],
    newSdgslabels = [],
    newBcglabels = [];
  uniqueObjects.map((item) => {
    if (item.cluster_id) {
      const label = JSON.parse(item.cluster_id).map((v) => cluster_obj[v]);
      label.map((v) => newCluserlabels.push(v));
    }
    if (item.curve_id) {
      const label = JSON.parse(item.curve_id).map((v) => curve_obj[v]);
      label.map((v) => newCurvelabels.push(v));
    }
    if (item.sdgs_id) {
      const label = JSON.parse(item.sdgs_id).map((v) => sdgs_obj[v]);
      label.map((v) => newSdgslabels.push(v));
    }
    if (item.bcg_id) {
      const label = JSON.parse(item.bcg_id).map((v) => bcg_obj[v]);
      label.map((v) => newBcglabels.push(v));
    }
  });

  let clusterLabels = [...new Set(newCluserlabels)].map((v) => {
    return { label: v };
  });

  let curveLabels = [...new Set(newCurvelabels)].map((v) => {
    return { label: v };
  });

  let sdgsLabels = [...new Set(newSdgslabels)].map((v) => {
    return { label: v };
  });

  let bcgLabels = [...new Set(newBcglabels)].map((v) => {
    return { label: v };
  });

  return [
    {
      label: "องค์ความรู้เดิม",
      groups: knowledgeLabels,
    },
    {
      label: "องค์ความรู้ใหม่",
      groups: newKnowledgeLabels,
    },
    {
      label: "นวัตกรรม",
      groups: newInnovationsLabels,
    },
    {
      label: "ผลกระทบ",
      groups: impactLabels,
    },
    {
      label: "BCG",
      groups: bcgLabels,
    },
    {
      label: "SDGS",
      groups: sdgsLabels,
    },
    {
      label: "10s CURVE",
      groups: curveLabels,
    },
    {
      label: "RMUTI Cluster",
      groups: clusterLabels,
    },
  ];
}

async function getDetail() {
  const rows = await db.query(``)
  const data = helper.emptyOrRows(rows)
  return data
}

module.exports = {
  getPieChart,
  getDetail
};
