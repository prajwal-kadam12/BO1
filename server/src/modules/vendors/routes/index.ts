import { Router } from 'express';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export const vendorsRouter = Router();

const vendorsFilePath = join(process.cwd(), 'server/data/vendors.json');

function readVendorsData() {
  if (!existsSync(vendorsFilePath)) {
    return { vendors: [] };
  }
  const data = readFileSync(vendorsFilePath, 'utf-8');
  return JSON.parse(data);
}

vendorsRouter.get('/', (req, res) => {
  try {
    const data = readVendorsData();
    res.json({ success: true, data: data.vendors || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch vendors' });
  }
});

vendorsRouter.get('/:id', (req, res) => {
  try {
    const data = readVendorsData();
    const vendor = data.vendors.find((v: any) => v.id === req.params.id);
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }
    res.json({ success: true, data: vendor });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch vendor' });
  }
});

vendorsRouter.post('/', (req, res) => {
  res.json({ success: true, data: req.body, message: 'Vendor created' });
});

export default vendorsRouter;
