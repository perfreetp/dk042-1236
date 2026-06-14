import db from '../db'
import type { Report } from '../../shared/types'

interface ReportRow {
  id: number
  prompt_id: number
  reporter_id: number
  reason: string
  description: string
  status: string
  created_at: string
}

function mapReportRow(row: ReportRow): Report {
  return {
    id: row.id,
    promptId: row.prompt_id,
    reporterId: row.reporter_id,
    reason: row.reason,
    description: row.description || '',
    status: row.status as 'pending' | 'resolved' | 'rejected',
    createdAt: row.created_at
  }
}

export const ReportRepository = {
  async findAll(
    status?: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<{ items: Report[]; total: number }> {
    const whereClauses: string[] = []
    const params: any[] = []

    if (status) {
      whereClauses.push('status = ?')
      params.push(status)
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''

    const countSql = `SELECT COUNT(*) as total FROM reports ${whereSql}`
    const countResult = db.getOne<{ total: number }>(countSql, params)
    const total = countResult?.total || 0

    const offset = (page - 1) * pageSize
    const dataSql = `
      SELECT * FROM reports
      ${whereSql}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `
    const dataParams = [...params, pageSize, offset]
    const rows = db.getMany<ReportRow>(dataSql, dataParams)

    return {
      items: rows.map(mapReportRow),
      total
    }
  },

  async findById(id: number): Promise<Report | null> {
    const sql = 'SELECT * FROM reports WHERE id = ?'
    const row = db.getOne<ReportRow>(sql, [id])
    return row ? mapReportRow(row) : null
  },

  async create(data: {
    promptId: number
    reporterId: number
    reason: string
    description: string
  }): Promise<Report> {
    const result = db.runQuery(
      'INSERT INTO reports (prompt_id, reporter_id, reason, description) VALUES (?, ?, ?, ?)',
      [data.promptId, data.reporterId, data.reason, data.description]
    )
    const reportId = result.lastInsertRowid as number
    return (await ReportRepository.findById(reportId))!
  },

  async updateStatus(id: number, status: 'resolved' | 'rejected'): Promise<Report | null> {
    db.runQuery(
      'UPDATE reports SET status = ? WHERE id = ?',
      [status, id]
    )
    return ReportRepository.findById(id)
  }
}

export default ReportRepository
