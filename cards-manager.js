import { pool } from "./db.js";

function mapRow(row) {
  if (!row) return null;
  return {
    cardId: row.id,
    front: row.front,
    explain: row.explain,
    expireMs: Number(row.expire_ms),
    createdAt: row.created_at?.toISOString?.() ?? row.created_at,
    lastReviewed: row.last_reviewed
      ? row.last_reviewed.toISOString?.() ?? row.last_reviewed
      : null,
  };
}

export async function addCard(userId, front, explain, expireDays = 7) {
  const expireMs = Number(expireDays) * 24 * 60 * 60 * 1000;
  const { rows } = await pool.query(
    `INSERT INTO cards (user_id, front, explain, expire_ms)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [userId, front, explain, expireMs],
  );
  return mapRow(rows[0]);
}

export async function getCards(userId) {
  const { rows } = await pool.query(
    `SELECT * FROM cards WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId],
  );
  return rows.map(mapRow);
}

export async function getCardsByStatus(userId, status) {
  if (status === "unlearned") {
    const { rows } = await pool.query(
      `SELECT * FROM cards
        WHERE user_id = $1 AND last_reviewed IS NULL
        ORDER BY created_at DESC`,
      [userId],
    );
    return rows.map(mapRow);
  }
  if (status === "due") {
    return getDueCards(userId);
  }
  if (status === "learned") {
    const { rows } = await pool.query(
      `SELECT * FROM cards
        WHERE user_id = $1
          AND last_reviewed IS NOT NULL
          AND last_reviewed + (expire_ms || ' milliseconds')::interval > NOW()
        ORDER BY created_at DESC`,
      [userId],
    );
    return rows.map(mapRow);
  }
  return getCards(userId);
}

export async function getCard(userId, cardId) {
  const { rows } = await pool.query(
    `SELECT * FROM cards WHERE user_id = $1 AND id = $2`,
    [userId, cardId],
  );
  return mapRow(rows[0]);
}

export async function updateCard(userId, cardId, updates) {
  const fields = [];
  const values = [];
  let i = 1;
  if (updates.front !== undefined) {
    fields.push(`front = $${i++}`);
    values.push(updates.front);
  }
  if (updates.explain !== undefined) {
    fields.push(`explain = $${i++}`);
    values.push(updates.explain);
  }
  if (updates.expireMs !== undefined) {
    fields.push(`expire_ms = $${i++}`);
    values.push(updates.expireMs);
  }
  if (updates.lastReviewed !== undefined) {
    fields.push(`last_reviewed = $${i++}`);
    values.push(updates.lastReviewed);
  }
  if (fields.length === 0) return getCard(userId, cardId);

  values.push(userId, cardId);
  const { rows } = await pool.query(
    `UPDATE cards SET ${fields.join(", ")}
      WHERE user_id = $${i++} AND id = $${i}
      RETURNING *`,
    values,
  );
  return mapRow(rows[0]);
}

export async function deleteCard(userId, cardId) {
  const { rowCount } = await pool.query(
    `DELETE FROM cards WHERE user_id = $1 AND id = $2`,
    [userId, cardId],
  );
  return rowCount > 0;
}

export async function reviewCard(userId, cardId, reviewOption = "easy") {
  const card = await getCard(userId, cardId);
  if (!card) return null;

  const updates = { lastReviewed: new Date() };
  switch (reviewOption) {
    case "hard":
      updates.expireMs = 5 * 60 * 1000;
      break;
    case "good":
      updates.expireMs = 24 * 60 * 60 * 1000;
      break;
    case "easy":
    default:
      updates.expireMs = card.expireMs * 2;
      break;
  }
  return updateCard(userId, cardId, updates);
}

export async function getDueCards(userId) {
  const { rows } = await pool.query(
    `SELECT * FROM cards
      WHERE user_id = $1
        AND (
          last_reviewed IS NULL
          OR last_reviewed + (expire_ms || ' milliseconds')::interval <= NOW()
        )
      ORDER BY COALESCE(last_reviewed, created_at) ASC`,
    [userId],
  );
  return rows.map(mapRow);
}

export async function getCardStats(userId) {
  const { rows } = await pool.query(
    `SELECT
       COUNT(*)                                                       AS total,
       COUNT(*) FILTER (WHERE last_reviewed IS NULL)                  AS unlearned,
       COUNT(*) FILTER (
         WHERE last_reviewed IS NULL
            OR last_reviewed + (expire_ms || ' milliseconds')::interval <= NOW()
       )                                                              AS due
     FROM cards
     WHERE user_id = $1`,
    [userId],
  );
  const r = rows[0];
  return {
    total: Number(r.total),
    unlearned: Number(r.unlearned),
    due: Number(r.due),
  };
}

export default {
  addCard,
  getCards,
  getCardsByStatus,
  getCard,
  updateCard,
  deleteCard,
  reviewCard,
  getDueCards,
  getCardStats,
};
