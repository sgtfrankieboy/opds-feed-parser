import OPDSFeed from "./opds_feed";
import OPDSAcquisitionLink from "./opds_acquisition_link";
import NavigationFeed from "./navigation_feed";
import AcquisitionFeed from "./acquisition_feed";
import LinkParser from "./link_parser";
import EntryParser from "./entry_parser";
import NamespaceParser from "./namespace_parser";
import Xml2jsOutputParser from "./xml2js_output_parser";

export default class FeedParser extends Xml2jsOutputParser<OPDSFeed> {
  parse(feed: any): OPDSFeed {
    let atomPrefix = this.prefixes[NamespaceParser.ATOM_URI];
    let fhPrefix = this.prefixes[NamespaceParser.FH_URI];

    let linkParser = new LinkParser(this.prefixes);
    let entryParser = new EntryParser(this.prefixes);

    let id = this.parseSubtagContent(feed, atomPrefix + "id");
    let title = this.parseSubtagContent(feed, atomPrefix + "title");
    let updated = this.parseSubtagContent(feed, atomPrefix + "updated");
    let links = this.parseSubtags(feed, atomPrefix + "link", linkParser);
    let entries = this.parseSubtags(feed, atomPrefix + "entry", entryParser);
    let complete = !!feed[fhPrefix + "complete"];

    let openSearchPrefix = this.prefixes[NamespaceParser.OPEN_SEARCH_URI];
    let totalResults = parseInt(this.parseSubtagContent(feed, openSearchPrefix + "totalResults"), 10);
    let startIndex = parseInt(this.parseSubtagContent(feed, openSearchPrefix + "startIndex"), 10);
    let itemsPerPage = parseInt(this.parseSubtagContent(feed, openSearchPrefix + "itemsPerPage"), 10);
    let search = { totalResults, startIndex, itemsPerPage };

    let args = { id, title, updated, entries, links, complete, search, unparsed: feed };

    let allEntriesHaveAcquisitionLinks: boolean = entries.every((entry) => {
      return !!entry.links.find((link) => {
        return (link instanceof OPDSAcquisitionLink);
      });
    });
    if (allEntriesHaveAcquisitionLinks) {
      return new AcquisitionFeed(args);
    } else {
      return new NavigationFeed(args);
    }
  }
}