/*
 Ok, here is our SQL schema. The backing database
 is postgresql, and for now the primary
 thing we are targeting is support for labs + grading.
 The way this will work is as such, for now:
 1. The grader view can list all available labs, create
 new ones, or delete them. Under the hood, this is simply
 a list of SQL rows defining each lab.
 2. The standard in this SQL setup is that we will be using UUIDs
 for all primary keys, makes it stupid simple to do joins and such.
 Our format is YYYY-MM-DD-HH-MM-SS-uuidv4, where M, D, H, m, S are
 all zero indexed padded numbers.
 3. Each lab has a title, and then a sequence of markdown descriptions
    interspersed with grading requests. The way this wil be setup is that
    you create the test case first, and then link to it inside the markdown
    using its markdown, in a special block designated like this:
    <lab-testcase id="the-uuid-of-the-testcase" /> 
    If we can't find it, we just render an error message in the grader + student
    view, but it works fine.
 4. Each test case has a title, a description, and then a JSON schema describing it. For
    our case, it looks like this:
    {
    "register_settings" : {
      // Any registers you want pre-set to anything that's not 0x0 should be put in here, rest are empty
    "x0" : "0xa" // This overrides the default value of 0
    },
    "memory_settings" : {
      "0x0" : "0xa" // Similarly, overrides the default memory value for this address
      },
    "targetLabel": "label_name", // The label that this test case is targeting
    "registers" : {
        "x1" : "0xb", // Expected value of register x1 at the target label
        "x2" : "0xc"
    }, 
    "memory" : {
        "0x10" : "0xdeadbeef" // Expected value at memory address 0x10 at the target label
    }
    }
 5. The grader view can create, edit, and delete test cases, which are in a sub-tab
    of the lab view, since test cases are scoped to labs.

That's it for now. Later we can add auth, storing lab grading results, etc.
*/

-- Labs table
CREATE TABLE labs (
    id TEXT PRIMARY KEY, -- UUID in format: YYYY-MM-DD-HH-MM-SS-uuidv4
    title TEXT NOT NULL,
    sections_list JSONB NOT NULL -- JSON array of lab section IDs in order
);

-- Test cases table
CREATE TABLE test_cases (
    id TEXT PRIMARY KEY, -- UUID in format: YYYY-MM-DD-HH-MM-SS-uuidv4
    lab_id TEXT NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    config JSONB NOT NULL -- JSON schema containing register_settings, memory_settings, targetLabel, registers, memory
);

-- Lab sections table
CREATE TABLE lab_sections (
    id TEXT PRIMARY KEY, -- UUID in format: YYYY-MM-DD-HH-MM-SS-uuidv4
    lab_id TEXT NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
    content JSONB NOT NULL
);

-- Indexes for better performance
CREATE INDEX idx_test_cases_lab_id ON test_cases(lab_id);
CREATE INDEX idx_lab_sections_lab_id ON lab_sections(lab_id);
