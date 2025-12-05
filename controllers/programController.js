
// This handles everything for sacrament meeting programs the public list, public view, admin edit/create, and PDF versions
// routes for this are in the routes/programs.js

const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const Program = require('../models/Program');
const Member = require('../models/Member');


// loadHymns — grabs hymns from /data/hymns.json. are used for dropdowns in the edit form.
// wrapped in try/catch so a missing file won’t crash the app.
function loadHymns() {
  const filePath = path.join(__dirname, '..', 'data', 'hymns.json');
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    console.error('Hymn file load error:', err.message);
    return [];
  }
}


// cleanId — helper to turn "" into null, used for member dropdowns where empty shouldn't be saved as ""
function cleanId(val) {
  return val && val.trim() !== '' ? val.trim() : null;
}


// buildHymn — builds a hymn object from form values, kept this simple so update/create stay clean
function buildHymn(num, title) {
  if (!num || !title) return undefined;
  const n = String(num).trim();
  const t = String(title).trim();
  if (!n || !t) return undefined;
  return { number: n, title: t };
}


// speakerArray — makes sure form values are always arrays
function speakerArray(val) {
  if (Array.isArray(val)) return val;
  if (typeof val === 'undefined') return [];
  return [val];
}


// nameFromMember builds "First Last"
function nameFromMember(m) {
  return m ? `${m.firstName || ''} ${m.lastName || ''}`.trim() : '';
}


// hymnLine formats “Opening Hymn: #3 – Nearer My God to Thee”.
//this one was more advance or at least I had to get extra help to walk me though how to insert the hyms
function hymnLine(label, hymn) {
  if (!hymn || !hymn.number || !hymn.title) return `${label}: —`;
  return `${label}: #${hymn.number} – ${hymn.title}`;
}

// exports.list — GET /programs shows all programs, newest first
// basic query  populate so we can show member names
exports.list = async (req, res, next) => {
  try {
    const programs = await Program.find()
      .populate('presiding conducting')
      .sort({ date: -1 })
      .lean();

    res.render('programs/index', {
      title: 'Sacrament Programs',
      programs
    });
  } catch (err) {
    console.error('Program list error:', err);
    next(err);
  }
};


// This starts the Public View everything before waas admin
// exports.show — GET /programs/:id loads 1 program and shows it nicely on its own page, lots of populates here so all member names show up.
exports.show = async (req, res, next) => {
  try {
    const program = await Program.findById(req.params.id)
      .populate('presiding conducting chorister organist')
      .populate('openingPrayer closingPrayer')
      .populate('speakers.member')
      .lean();

    if (!program) {
      return res.status(404).render('404', { title: 'Program Not Found' });
    }

    res.render('programs/show', {
      title: `Sacrament Meeting — ${program.date}`,
      program
    });
  } catch (err) {
    console.error('Program detail error:', err);
    next(err);
  }
};


// The PDF BUILDER

// buildPdfForProgram — builds the PDF for a program advanced part because I had to manually write layout, text, spacing, etc.
function buildPdfForProgram(program, res, options = {}) {
  const doc = new PDFDocument({ margin: 50 });

  const filename = options.admin
    ? `program-${program.date}-admin.pdf`
    : `program-${program.date}.pdf`;

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${filename}"`);

  doc.pipe(res);

  // PDF title block
  doc.fontSize(18).text(
    `${program.title || 'Sacrament Meeting'}${options.admin ? ' (Admin Copy)' : ''}`,
    { align: 'center' }
  );

  doc.moveDown(0.5).fontSize(12).text(program.date || '', { align: 'center' });

  if (program.theme) {
    doc.moveDown(0.3).fontSize(11).text(`Theme: ${program.theme}`, { align: 'center' });
  }

  doc.moveDown();

  // rest of the PDF is just text building
  // more advance or above my levele had to be walked though it at first
  if (program.announcements) {
    doc.fontSize(14).text('Announcements', { underline: true });
    doc.fontSize(11).text(program.announcements);
    doc.moveDown();
  }

  if (program.stakeBusiness || program.wardBusiness) {
    doc.fontSize(14).text('Stake & Ward Business');
    doc.fontSize(11);
    if (program.stakeBusiness) doc.text(`Stake Business: ${program.stakeBusiness}`);
    if (program.wardBusiness) doc.text(`Ward Business: ${program.wardBusiness}`);
    doc.moveDown();
  }

  if (program.greeter) {
    doc.fontSize(11).text(`Greeter: ${program.greeter}`);
    doc.moveDown();
  }

  doc.fontSize(14).text('Presiding & Conducting');
  doc.fontSize(11);
  doc.text(`Presiding:  ${nameFromMember(program.presiding) || '—'}`);
  doc.text(`Conducting: ${nameFromMember(program.conducting) || '—'}`);
  doc.text(`Organist:   ${nameFromMember(program.organist) || '—'}`);
  doc.text(`Chorister:  ${nameFromMember(program.chorister) || '—'}`);
  doc.moveDown();

  doc.fontSize(14).text('Opening');
  doc.fontSize(11);
  doc.text(hymnLine('Opening Hymn', program.openingHymn));
  doc.text(`Invocation: ${nameFromMember(program.openingPrayer) || '—'}`);
  doc.moveDown();

  doc.fontSize(14).text('Sacrament');
  doc.fontSize(11);
  doc.text(hymnLine('Sacrament Hymn', program.sacramentHymn));
  doc.text('Administration of the Sacrament');
  doc.moveDown();

  if (program.speakers?.length > 0) {
    doc.fontSize(14).text('Speakers');
    doc.fontSize(11);

    const sorted = [...program.speakers].sort(
      (a, b) => (a.order || 0) - (b.order || 0)
    );

    sorted.forEach((s, i) => {
      const speakerName =
        s.otherName || nameFromMember(s.member) || `Speaker ${i + 1}`;
      doc.text(s.topic ? `${speakerName} — ${s.topic}` : speakerName);
    });

    doc.moveDown();
  }

  if (program.includeBearingOfTestimonies) {
    doc.text('Bearing of Testimonies');
    doc.moveDown();
  }

  if (program.intermediateHymn?.number) {
    doc.fontSize(14).text('Intermediate Hymn');
    doc.fontSize(11).text(hymnLine('Intermediate Hymn', program.intermediateHymn));
    doc.moveDown();
  }

  doc.fontSize(14).text('Closing');
  doc.fontSize(11);
  doc.text(hymnLine('Closing Hymn', program.closingHymn));
  doc.text(`Benediction: ${nameFromMember(program.closingPrayer) || '—'}`);
  doc.moveDown();

  doc.fontSize(14).text('Second Hour');
  doc.fontSize(11).text(
    program.secondHourType === 'Other' && program.secondHourOtherText
      ? program.secondHourOtherText
      : program.secondHourType || '—'
  );

  if (options.admin) {
    doc.moveDown(2).fontSize(9).text(`Admin Copy — Program ID: ${program._id}`);
  }

  doc.end();
}


// exports.downloadPdf — GET /programs/:id/pdf sends the normal public PDF.
exports.downloadPdf = async (req, res, next) => {
  try {
    const program = await Program.findById(req.params.id)
      .populate('presiding conducting chorister organist')
      .populate('openingPrayer closingPrayer')
      .populate('speakers.member')
      .lean();

    if (!program) return res.status(404).send('Program not found');

    buildPdfForProgram(program, res, { admin: false });
  } catch (err) {
    console.error('PDF error:', err);
    next(err);
  }
};


// exports.downloadAdminPdf — GET /programs/:id/admin-pdf same as above but with extra details(only admins can view this one)
exports.downloadAdminPdf = async (req, res, next) => {
  try {
    if (!req.session?.user || req.session.user.role !== 'admin') {
      return res.status(403).send('Admin access required.');
    }

    const program = await Program.findById(req.params.id)
      .populate('presiding conducting chorister organist')
      .populate('openingPrayer closingPrayer')
      .populate('speakers.member')
      .lean();

    if (!program) return res.status(404).send('Program not found');

    buildPdfForProgram(program, res, { admin: true });
  } catch (err) {
    console.error('Admin PDF error:', err);
    next(err);
  }
};


//Admin Edit option
// exports.edit — GET /programs/:id/edit  loads a program + hymn list + member list so the admin can edit everything
exports.edit = async (req, res, next) => {
  try {
    const program = await Program.findById(req.params.id)
      .populate('presiding conducting chorister organist')
      .populate('openingPrayer closingPrayer')
      .populate('speakers.member')
      .lean();

    if (!program) {
      return res.status(404).render('404', { title: 'Program Not Found' });
    }

    const members = await Member.find()
      .sort({ lastName: 1, firstName: 1 })
      .lean();
    const hymns = loadHymns();

    res.render('programs/edit', {
      title: `Edit Program — ${program.date}`,
      program,
      members,
      hymns
    });
  } catch (err) {
    console.error('Edit load error:', err);
    next(err);
  }
};

// exports.update — POST /programs/:id/edit saves all admin edits 
exports.update = async (req, res, next) => {
  try {
    const program = await Program.findById(req.params.id);
    if (!program) return res.status(404).render('404');

    program.title = req.body.title || program.title || 'Sacrament Meeting';
    program.date = req.body.date || program.date;
    program.theme = req.body.theme || '';

    program.announcements = req.body.announcements || '';
    program.stakeBusiness = req.body.stakeBusiness || '';
    program.wardBusiness = req.body.wardBusiness || '';
    program.greeter = req.body.greeter || '';

    program.includeBearingOfTestimonies = !!req.body.includeBearingOfTestimonies;

    program.secondHourType = req.body.secondHourType || 'Sunday School';
    program.secondHourOtherText = req.body.secondHourOtherText || '';

    program.presiding = cleanId(req.body.presiding);
    program.conducting = cleanId(req.body.conducting);
    program.chorister = cleanId(req.body.chorister);
    program.organist = cleanId(req.body.organist);

    program.openingPrayer = cleanId(req.body.openingPrayer);
    program.closingPrayer = cleanId(req.body.closingPrayer);

    program.openingHymn = buildHymn(
      req.body.openingHymnNumber,
      req.body.openingHymnTitle
    );
    program.sacramentHymn = buildHymn(
      req.body.sacramentHymnNumber,
      req.body.sacramentHymnTitle
    );
    program.intermediateHymn = buildHymn(
      req.body.intermediateHymnNumber,
      req.body.intermediateHymnTitle
    );
    program.closingHymn = buildHymn(
      req.body.closingHymnNumber,
      req.body.closingHymnTitle
    );

    // speakers — advanced part where I combine multiple input arrays
    const ids = speakerArray(req.body.speakersMember);
    const names = speakerArray(req.body.speakersOtherName);
    const topics = speakerArray(req.body.speakersTopic);
    const orders = speakerArray(req.body.speakersOrder);

    const speakers = [];
    const max = Math.max(ids.length, names.length, topics.length, orders.length);

    for (let i = 0; i < max; i++) {
      const hasAny =
        (ids[i] && ids[i].trim()) ||
        (names[i] && names[i].trim()) ||
        (topics[i] && topics[i].trim());

      if (!hasAny) continue;

      speakers.push({
        member: cleanId(ids[i]),
        otherName: names[i]?.trim() || undefined,
        topic: topics[i]?.trim() || undefined,
        order: orders[i] ? Number(orders[i]) : i + 1
      });
    }

    program.speakers = speakers;

    await program.save();
    res.redirect(`/programs/${program._id}`);
  } catch (err) {
    console.error('Program update error:', err);
    next(err);
  }
};



// exports.create — POST /programs/new creates a new empty program and then sends admin straight to edit page.

exports.create = async (req, res, next) => {
  try {
    let date = req.body.date;

    if (!date) {
      const t = new Date();
      const yyyy = t.getFullYear();
      const mm = String(t.getMonth() + 1).padStart(2, '0');
      const dd = String(t.getDate()).padStart(2, '0');
      date = `${yyyy}-${mm}-${dd}`;
    }

    const program = await Program.create({
      title: req.body.title || 'Sacrament Meeting',
      date,
      theme: req.body.theme || '',
      createdBy: req.session?.user?._id || null
    });

    res.redirect(`/programs/${program._id}/edit`);
  } catch (err) {
    console.error('New program creation error:', err);
    next(err);
  }
};
