
module.exports = {
    Course: function Course(subject, number, credits) {
        this.subject = subject;
        this.number = number;
        if (credits !== undefined)
            this.credits = credits;
    },
    /**
     * Creates a new CourseEquivalency.
     *
     * @param keyCourse Course to perform lookups on. Created with only subject
     *                  and number, no credits
     * @param input Array of courses from NVCC
     * @param output Array of ocurses from `institution`
     * @param type Equivalency type. Must be a value specified by models.TYPE_*
     */
    CourseEquivalency: function CourseEquivalency(input, output, type) {
        this.keyCourse = new module.exports.Course(input[0].subject, input[0].number);
        this.input = input;
        this.output = output;
        this.type = type;
    },
    EquivalencyContext: function EquivalencyContext(institution, equivalencies) {
        this.institution = institution;
        this.equivalencies = equivalencies;
    },
    Institution: function(acronym, fullName, location) {
        this.acronym = acronym;
        this.fullName = fullName;
        this.location = location;
    },
    // No information about credits given
    CREDITS_UNKNOWN: -1,
    // Transfers directly to a specific class
    TYPE_DIRECT: 'direct',
    // At least one course transfers as a generic course
    TYPE_GENERIC: 'generic',
    // The student should clarify with the institution
    TYPE_SPECIAL: 'special',
    // Doesn't transfer at all
    TYPE_NONE: 'none'
};