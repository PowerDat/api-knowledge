const db = require("./db");
const helper = require("../helper");

async function getpiechartnewknowledge() {
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
      label: item.outcome_knowledge_detail.replace(/<[^>]+>/g, ''),
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
    return { label: v.replace(/&/g, "and") };
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
    // {
    //   label: "องค์ความรู้เดิม",
    //   groups: knowledgeLabels,
    // },
    {
      label: "องค์ความรู้ใหม่",
      groups: newKnowledgeLabels,
    },
    {
      label: "นวัตกรรม",
      groups: newInnovationsLabels,
    },
    // {
    //   label: "ผลกระทบ",
    //   groups: impactLabels,
    // },
    // {
    //   label: "BCG",
    //   groups: bcgLabels,
    // },
    // {
    //   label: "SDGs",
    //   groups: sdgsLabels,
    // },
    // {
    //   label: "10s Curve",
    //   groups: curveLabels,
    // },
    // {
    //   label: "RMUTI Cluster",
    //   groups: clusterLabels,
    // },
  ];
}

async function getDetailnewknowledge(group) {
  const innovation = await db.query(`
    SELECT * FROM progress_report_output pro 
    INNER JOIN progress_report pr 
    ON pr.progress_report_id = pro.progress_report_id
    INNER JOIN concept_proposal cp on cp.concept_proposal_id = pr.concept_proposal_id`);
  const innovationData = helper.emptyOrRows(innovation);

  const newKnowledge = await db.query(
    `SELECT * FROM progress_report_outcome_knowledge prok 
      inner join progress_report_outcome pro on pro.outcome_id = prok.outcome_id
      inner join progress_report pr on pr.progress_report_id = pro.progress_report_id
      inner join concept_proposal cp on cp.concept_proposal_id = pr.concept_proposal_id`
  );
  const newKnowledgeData = helper.emptyOrRows(newKnowledge);

  const knowledge = await db.query(
    `SELECT * FROM progress_report_knowledge prk 
    inner join progress_report_knowledge_group prkg on prkg.knowledge_group_id = prk.knowledge_group_id
    inner join progress_report pr on pr.progress_report_id = prk.progress_report_id
    inner join concept_proposal cp on pr.concept_proposal_id = cp.concept_proposal_id`
  );
  const knowledgeData = helper.emptyOrRows(knowledge);

  const impact = await db.query(
    `SELECT * FROM bd_sum_impact bsi inner join concept_proposal cp on bsi.concept_proposal_id = cp.concept_proposal_id`
  );
  const impactData = helper.emptyOrRows(impact);
  const newImpactData = [
    ...new Map(
      impactData.map((item) => [item.concept_proposal_id, item])
    ).values(),
  ];

  const goal = await db.query(
    `SELECT * FROM bd_sum_goal bsg inner join concept_proposal cp on bsg.concept_proposal_id = cp.concept_proposal_id`
  );
  const goalData = helper.emptyOrRows(goal);
  const newGoaltData = [
    ...new Map(
      goalData.map((item) => [item.concept_proposal_id, item])
    ).values(),
  ];

  async function getObj(sql, idx, property) {
    const rows = await db.query(sql);
    const data = helper.emptyOrRows(rows);
    const array = data.map((list, index) => {
      return { [list[`${idx}`]]: list[`${property}`] };
    });
    const obj = Object.assign({}, ...array);
    return obj;
  }

  const prefix_obj = await getObj(
    `SELECT * FROM user_prefix`,
    "prefix_id",
    "prefix_name_th"
  );

  async function getUser() {
    const users = await db.query(`select * from bb_user `);
    const data = helper.emptyOrRows(users);
    const array = data.map((list, index) => {
      return {
        [list.user_idcard]: `${prefix_obj[list.prefix_id]}${
          list.user_first_name_th
        } ${list.user_last_name_th}`,
      };
    });
    const obj = Object.assign({}, ...array);
    return obj;
  }

  const user_obj = await getUser();

  const impactObj = await getObj(
    `SELECT * FROM bd_outcome_impact`,
    "impact_id",
    "impact_name"
  );

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

  // console.log(newGoaltData);
  let bcg = [],
    sdgs = [],
    curve = [],
    cluster = [];

  newGoaltData.map((v) => {
    if (v.bcg_id) {
      const goal = JSON.parse(v.bcg_id).map((val) => {
        return {
          bcg_name: bcg_obj[val],
        };
      });
      goal.map((val) => {
        bcg.push({
          title: val.bcg_name,
          detail: null,
          image: null,
          concept_id: v.concept_proposal_id,
          project_name_th: v.concept_proposal_name_th,
          project_name_en: v.concept_proposal_name_en,
          researcher: user_obj[v.user_idcard],
          group_name: "BCG",
        });
      });
    }
    if (v.sdgs_id) {
      const goal = JSON.parse(v.sdgs_id).map((val) => {
        return {
          sdgs_name: sdgs_obj[val],
        };
      });
      goal.map((val) => {
        sdgs.push({
          title: val.sdgs_name,
          detail: null,
          image: null,
          concept_id: v.concept_proposal_id,
          project_name_th: v.concept_proposal_name_th,
          project_name_en: v.concept_proposal_name_en,
          researcher: user_obj[v.user_idcard],
          group_name: "SDGs",
        });
      });
    }
    if (v.curve_id) {
      const goal = JSON.parse(v.curve_id).map((val) => {
        return {
          curve_name: curve_obj[val],
        };
      });
      goal.map((val) => {
        curve.push({
          title: val.curve_name,
          detail: null,
          image: null,
          concept_id: v.concept_proposal_id,
          project_name_th: v.concept_proposal_name_th,
          project_name_en: v.concept_proposal_name_en,
          researcher: user_obj[v.user_idcard],
          group_name: "10s Curve",
        });
      });
    }
    if (v.cluster_id) {
      const goal = JSON.parse(v.cluster_id).map((val) => {
        return {
          cluster_name: cluster_obj[val],
        };
      });
      goal.map((val) => {
        cluster.push({
          title: val.cluster_name.replace(/&/g, "and"),
          detail: null,
          image: null,
          concept_id: v.concept_proposal_id,
          project_name_th: v.concept_proposal_name_th,
          project_name_en: v.concept_proposal_name_en,
          researcher: user_obj[v.user_idcard],
          group_name: "RMUTI Cluster",
        });
      });
    }
  });

  let new_impact = [];
  newImpactData.map((v) => {
    const impact = JSON.parse(v.impact_id).map((val) => {
      return {
        impact_name: impactObj[val],
      };
    });

    impact.map((val) => {
      new_impact.push({
        title: val.impact_name,
        detail: null,
        image: null,
        concept_id: v.concept_proposal_id,
        project_name_th: v.concept_proposal_name_th,
        project_name_en: v.concept_proposal_name_en,
        researcher: user_obj[v.user_idcard],
        group_name: "ผลกระทบ",
      });
    });
  });

  // console.log(new_impact);

  let realData = [];
  innovationData.map((v, i) => {
    realData.push({
      // id: i + 1,
      title: v.output_name,
      detail: v.output_detail,
      image: v.output_image,
      concept_id: v.concept_proposal_id,
      project_name_th: v.concept_proposal_name_th,
      project_name_en: v.concept_proposal_name_en,
      researcher: user_obj[v.user_idcard],
      group_name: "นวัตกรรม",
    });
  });

  newKnowledgeData.map((v, i) => {
    realData.push({
      title: v.outcome_knowledge_name,
      detail: v.outcome_knowledge_detail,
      image: v.outcome_knowledge_image,
      concept_id: v.concept_proposal_id,
      project_name_th: v.concept_proposal_name_th,
      project_name_en: v.concept_proposal_name_en,
      researcher: user_obj[v.user_idcard],
      group_name: "องค์ความรู้ใหม่",
    });
  });

  knowledgeData.map(async (v, i) => {
    realData.push({
      title: v.knowledge_group_category,
      detail: `<strong>${v.knowledge_name}</strong>: ${v.knowledge_detail}`,
      image: v.knowledge_image,
      concept_id: v.concept_proposal_id,
      project_name_th: v.concept_proposal_name_th,
      project_name_en: v.concept_proposal_name_en,
      researcher: user_obj[v.user_idcard],
      group_name: "องค์ความรู้เดิม",
    });
  });

  new_impact.map((v) => {
    realData.push(v);
  });
  bcg.map((v) => {
    realData.push(v);
  });
  sdgs.map((v) => {
    realData.push(v);
  });
  curve.map((v) => {
    realData.push(v);
  });
  cluster.map((v) => {
    realData.push(v);
  });

  if (group.groupName == "นวัตกรรม") {
    return realData.filter((x) => x.group_name === group.groupName);
  }
  if (group.groupName == "องค์ความรู้เดิม") {
    return realData.filter((x) => x.group_name === group.groupName);
  }
  if (group.groupName == "องค์ความรู้ใหม่") {
    return realData.filter((x) => x.group_name === group.groupName);
  }
  if (group.groupName == "ผลกระทบ") {
    return realData.filter((x) => x.group_name === group.groupName);
  }
  if (group.groupName == "BCG") {
    return realData.filter((x) => x.group_name === group.groupName);
  }
  if (group.groupName == "SDGs") {
    return realData.filter((x) => x.group_name === group.groupName);
  }
  if (group.groupName == "10s Curve") {
    return realData.filter((x) => x.group_name === group.groupName);
  }
  if (group.groupName == "RMUTI Cluster") {
    return realData.filter((x) => x.group_name === group.groupName);
  }

  if (group.groupName) {
    const filterData = realData.filter((x) => x.title === group.groupName);
    return filterData;
  } else {
    return realData;
  }
}

module.exports = {
  getpiechartnewknowledge,
  getDetailnewknowledge,
};
