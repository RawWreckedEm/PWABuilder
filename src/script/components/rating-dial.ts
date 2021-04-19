import {
  LitElement,
  html,
  css,
  customElement,
  internalProperty,
  TemplateResult,
} from 'lit-element';
import { getOverallScore } from '../services/tests';
import { env } from '../utils/environment';

type Rating = 'top' | 'middle' | 'bottom';

@customElement('rating-dial')
export class RatingDial extends LitElement {
  @internalProperty() rating: Rating = 'bottom';
  @internalProperty() overallScore = 0;
  @internalProperty() ratingComment = '';

  static get styles() {
    return css`
      #dial-block {
        display: flex;
        align-items: center;
        justify-content: center;
      }

      #pointer {
        position: absolute;
        transform-origin: bottom;
      }

      .overall-score {
        width: 100%;
        font-weight: var(--font-bold);
        margin-bottom: 14px;
        text-align: center;
        margin-top: -4px;

        background: initial;
        border-radius: initial;
        border: none;
      }

      #rating-comment {
        font-weight: var(--font-bold);
        font-size: var(--small-font-size);
        text-align: center;
        display: block;
      }

      #top {
        color: var(--success-color);
      }

      #middle {
        color: var(--warning-color);
      }

      #lower {
        color: var(--error-color);
      }
    `;
  }

  constructor() {
    super();
  }

  async firstUpdated() {
    const pointerEl = this.shadowRoot?.querySelector('#pointer');

    await this.calcRating();

    await this.updated;

    if (pointerEl) {
      switch (this.rating) {
        case 'top':
          pointerEl.animate(
            [
              {
                transform: 'rotate(90deg) translate(10px, 13px)',
              },
              {
                transform: 'rotate(0deg) translate(10px, 13px)',
              },
            ],
            {
              fill: 'forwards',
              easing: 'ease-in-out',
            }
          );

          break;
        case 'middle':
          pointerEl.animate(
            [
              {
                transform: 'rotate(0deg) translate(0px, 5px)',
              },
              {
                transform: 'rotate(-90deg) translate(0px, 5px)',
              },
            ],
            {
              fill: 'forwards',
              easing: 'ease-in-out',
            }
          );

          break;
        case 'bottom':
          pointerEl.animate(
            [
              {
                transform: 'rotate(0deg) translate(10px, -5px)',
              },
              {
                transform: 'rotate(-180deg) translate(10px, -5px)',
              },
            ],
            {
              fill: 'forwards',
              easing: 'ease-in-out',
            }
          );
          break;
      }
    }
  }

  async calcRating(): Promise<void> {
    const response = await fetch(env.ratingUrl);
    const scoreData = await response.json();

    // Adding 94 here to "shim" the data so that we can
    // fairly average it with our new scoring system
    // which ends up with much higher scores overall.
    // We wont need this once we start getting alot of data from v3 in prod
    const averageScore = scoreData.overallAverageScore + 94;
    this.overallScore = getOverallScore();

    if (
      (this.overallScore > averageScore &&
        this.overallScore < averageScore + 10) ||
      this.overallScore === averageScore
    ) {
      this.rating = 'middle';
      return;
    } else if (this.overallScore > averageScore + 10) {
      this.rating = 'top';
      return;
    } else if (this.overallScore < averageScore - 10) {
      this.rating = 'bottom';
      return;
    } else {
      this.rating = 'middle';
      return;
    }
  }

  decideComment(): TemplateResult {
    const topHTML = html`<span id="rating-comment"
      >Your PWA ranks in the <span id="top">Top 100</span> of all developers
      using PWA Builder</span
    > `;
    const middleHTML = html`<span id="rating-comment"
      >Your PWA ranks in the <span id="middle">middle</span> of all developers
      using PWA Builder</span
    > `;

    const lowerHTML = html`<span id="rating-comment"
      >Your PWA ranks <span id="lower">below the average</span> of all developers
      using PWA Builder</span
    > `;

    if (this.rating === 'middle') {
      return middleHTML;
    } else if (this.rating === 'top') {
      return topHTML;
    } else if (this.rating === 'bottom') {
      return lowerHTML;
    } else {
      return middleHTML;
    }
  }

  render() {
    return html`<div id="dial-block">
        <img aria-hidden="true" id="dial" src="/assets/dial.png" />
        <img aria-hidden="true" id="pointer" src="/assets/pointer.png" />
      </div>

      <div class="overall-score">${this.overallScore}</div>

      ${this.decideComment()} `;
  }
}
