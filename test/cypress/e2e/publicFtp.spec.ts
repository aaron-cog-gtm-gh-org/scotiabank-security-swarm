describe('/ftp', () => {
  it('should not list non-public files', () => {
    cy.request('/ftp').its('body').should('not.contain', 'acquisitions.md').and('not.contain', 'package.json.bak').and('not.contain', 'order_')
  })

  it('should not serve the confidential file /ftp/acquisitions.md', () => {
    cy.request({ url: '/ftp/acquisitions.md', failOnStatusCode: false }).its('status').should('eq', 403)
  })

  describe('challenge "errorHandling"', () => {
    it('should leak information through error message accessing /ftp/easter.egg due to wrong file suffix', () => {
      cy.visit('/ftp/easter.egg', { failOnStatusCode: false })

      cy.get('#stacktrace').then((elements) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        expect(!!elements.length).to.be.true
      })
      cy.expectChallengeSolved({ challenge: 'Error Handling' })
    })
  })

  for (const file of ['coupons_2013.md.bak', 'package.json.bak', 'eastere.gg', 'suspicious_errors.yml', 'encrypt.pyc']) {
    it(`should block poison null byte attack on /ftp/${file}`, () => {
      cy.request({ url: `/ftp/${file}%2500.md`, failOnStatusCode: false }).its('status').should('eq', 403)
    })
  }
})
