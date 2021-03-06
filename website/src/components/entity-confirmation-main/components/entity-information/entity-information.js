import React, { Component } from 'react';
import PropTypes from 'prop-types';
import styles from './entity-information.module.scss';
import moment from 'moment';

export default class EntityInformation extends Component {
  constructor(props) {
    super(props);
    this.state = {
      date: this.props.date
    };
    this.handleDateNextClicked = this.handleDateNextClicked.bind(this);
    this.handleDatePrevClicked = this.handleDatePrevClicked.bind(this);
  }

  handleDateNextClicked() {
    const date = this.state.date;
    const updatedDate = moment(date).add(1, 'day');
    this.setState({
      date: updatedDate
    });
    this.props.updateDate(updatedDate);
  }

  handleDatePrevClicked() {
    const date = this.state.date;
    const updatedDate = moment(date).add(-1, 'day');
    this.setState({
      date: updatedDate
    });
    this.props.updateDate(updatedDate);
  }

  render() {
    const entity = this.props.entity;
    const entityImage = (entity.image_path === '' || entity.image_path === null) ? '/images/user-default.svg' : entity.image_path;
    const arrowLeft  = <svg xmlns="http://www.w3.org/2000/svg" width="13.657" height="13.657" viewBox="0 0 13.657 13.657"><path d="M-90.024,11.657a.908.908,0,0,1-.675-.3.908.908,0,0,1-.3-.675V2.911A.911.911,0,0,1-90.09,2a.911.911,0,0,1,.911.911V9.836h6.925a.911.911,0,0,1,.911.911.911.911,0,0,1-.911.91Z" transform="translate(72.589 62.933) rotate(45)" fill="#8d959f"/></svg>;
    const arrowRight = <svg xmlns="http://www.w3.org/2000/svg" width="13.657" height="13.657" viewBox="0 0 13.657 13.657"><path d="M-90.024,11.657a.908.908,0,0,1-.675-.3.908.908,0,0,1-.3-.675V2.911A.911.911,0,0,1-90.09,2a.911.911,0,0,1,.911.911V9.836h6.925a.911.911,0,0,1,.911.911.911.911,0,0,1-.911.91Z" transform="translate(-58.932 -49.276) rotate(-135)" fill="#8d959f"/></svg>;
    return (
      <div className={styles.entityInformationWrapper}>
        <div className={styles.entityImage}>
          <img src={entityImage} alt={entity.name} />
        </div>
        <div className={styles.entityInfo}>
          <h2>Daily Assignments for {entity.name}</h2>
          <div className={styles.datePickerWrapper}>
            <button className={styles.arrow} onClick={() => this.handleDatePrevClicked()}>{arrowLeft}</button>
            <time>{moment(this.props.date).format('dddd MMM DD, YYYY')}</time>
            <button className={styles.arrow} onClick={() => this.handleDateNextClicked()}>{arrowRight}</button>
          </div>
          <p>Click on Accept All/Reject All to accept/reject all assignments. Select one by one to mark the assignments individually.</p>
        </div>
      </div>
    );
  }
}

EntityInformation.propTypes = {
  entity: PropTypes.object,
  date: PropTypes.string,
  updateDate: PropTypes.func
};
